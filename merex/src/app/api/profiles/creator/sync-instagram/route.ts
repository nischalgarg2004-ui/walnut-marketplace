import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decryptTokenFromStorage,
  encryptTokenForStorage,
  exchangeForLongLivedAccessToken,
  fetchInstagramIdentity,
  fetchInstagramMediaViewsTotal,
  refreshLongLivedAccessToken,
  shouldRefreshInstagramToken,
  fetchInstagramAudienceDemographics
} from "@/lib/integrations/instagram";
import { fetchInstagramProfileForSync } from "@/lib/integrations/instagram-public-profile";

type ProfileSyncStatus = "fresh" | "degraded" | "failed";

function isIgnorableInstagramRefreshError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();
  return (
    lower.includes("code=100") &&
    lower.includes("unsupported request - method type: get")
  );
}

function isUnsupportedMethodTypeGetError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();
  return lower.includes("code=100") && lower.includes("unsupported request - method type: get");
}

function classifySyncFailure(message: string): {
  reason: string;
  reconnectRecommended: boolean;
} {
  const lower = message.toLowerCase();
  if (lower.includes("code=190") || lower.includes("token")) {
    return { reason: "token_invalid", reconnectRecommended: true };
  }
  if (lower.includes("code=10") || lower.includes("code=200") || lower.includes("permission")) {
    return { reason: "scope_gap", reconnectRecommended: true };
  }
  if (lower.includes("private") || lower.includes("restricted")) {
    return { reason: "private_or_restricted", reconnectRecommended: false };
  }
  if (lower.includes("blocked") || lower.includes("challenge")) {
    return { reason: "web_blocked", reconnectRecommended: false };
  }
  return { reason: "source_unavailable", reconnectRecommended: false };
}

function isPlaceholderInstagramHandle(value: string | null | undefined): boolean {
  const normalized = (value ?? "").replace(/^@/, "").trim().toLowerCase();
  return /^instagram_\d+$/.test(normalized);
}

/**
 * Refreshes display name, follower count, post count, and profile photo.
 * Uses Instagram Graph `/me` when OAuth token is stored (reliable on serverless), then fills gaps from public web.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const profile = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    let accessToken = profile.instagramAccessTokenEncrypted
      ? decryptTokenFromStorage(profile.instagramAccessTokenEncrypted)
      : null;
    const raw = profile.instagramUsername ?? profile.instagramHandle;
    let username = raw?.replace(/^@/, "").trim() || "";
    if (username && isPlaceholderInstagramHandle(username)) {
      username = "";
    }
    if (!username && !accessToken) {
      const reconnectOnly = Boolean(profile.instagramConnectedAt);
      return NextResponse.json(
        reconnectOnly
          ? {
              error: "Instagram authorization is no longer valid for this account. Please reconnect Instagram and try again.",
              meta: {
                tokenRefreshed: false,
                syncStatus: "failed" as ProfileSyncStatus,
                syncReason: "token_lifecycle_broken",
                reconnectRecommended: true,
                syncMessage: "Reconnect Instagram to repair authorization, then retry Update from Instagram."
              }
            }
          : { error: "Connect Instagram or add an Instagram username to sync." },
        { status: reconnectOnly ? 409 : 400 }
      );
    }

    let tokenRefreshed = false;
    let tokenLifecycleBroken = false;
    if (accessToken && profile.instagramTokenExpiresAt && shouldRefreshInstagramToken(profile.instagramTokenExpiresAt)) {
      try {
        const refreshed = await refreshLongLivedAccessToken(accessToken);
        accessToken = refreshed.accessToken;
        tokenRefreshed = true;
        await db.creatorProfile.update({
          where: { userId: user.userId },
          data: {
            instagramAccessTokenEncrypted: encryptTokenForStorage(refreshed.accessToken),
            instagramTokenExpiresAt: buildTokenExpiryDate(refreshed.expiresInSeconds)
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        if (isIgnorableInstagramRefreshError(err)) {
          console.info("[instagram/sync] token refresh unsupported, attempting token re-exchange", {
            userId: user.userId
          });
          try {
            const exchanged = await exchangeForLongLivedAccessToken(accessToken);
            accessToken = exchanged.accessToken;
            tokenRefreshed = true;
            await db.creatorProfile.update({
              where: { userId: user.userId },
              data: {
                instagramAccessTokenEncrypted: encryptTokenForStorage(exchanged.accessToken),
                instagramTokenExpiresAt: buildTokenExpiryDate(exchanged.expiresInSeconds)
              }
            });
            console.info("[instagram/sync] token re-exchange succeeded after refresh rejection", {
              userId: user.userId
            });
          } catch (exchangeErr) {
            const exchangeMessage = exchangeErr instanceof Error ? exchangeErr.message : "unknown";
            tokenLifecycleBroken = true;
            if (isUnsupportedMethodTypeGetError(exchangeErr)) {
              await db.creatorProfile.update({
                where: { userId: user.userId },
                data: {
                  instagramAccessTokenEncrypted: null,
                  instagramTokenExpiresAt: null
                }
              });
              accessToken = null;
              console.info("[instagram/sync] invalidated unsupported Instagram token; reconnect required", {
                userId: user.userId
              });
            }
            console.warn("[instagram/sync] token re-exchange failed after refresh rejection", {
              userId: user.userId,
              error: exchangeMessage
            });
          }
        } else {
          console.warn("[instagram/sync] token refresh failed", {
            userId: user.userId,
            error: message
          });
        }
      }
    }

    if (tokenLifecycleBroken) {
      return NextResponse.json(
        {
          error: "Instagram authorization has expired or is incompatible for this account. Please reconnect Instagram and try again.",
          meta: {
            tokenRefreshed: false,
            syncStatus: "failed" as ProfileSyncStatus,
            syncReason: "token_lifecycle_broken",
            reconnectRecommended: true,
            syncMessage: "Reconnect Instagram to repair authorization, then retry Update from Instagram."
          }
        },
        { status: 409 }
      );
    }

    let resolvedUsername = username;
    if (!resolvedUsername && accessToken) {
      try {
        const identity = await fetchInstagramIdentity(accessToken);
        const candidate = (identity.username ?? "").replace(/^@/, "").trim();
        if (candidate && !isPlaceholderInstagramHandle(candidate)) {
          resolvedUsername = candidate;
          console.info("[instagram/sync] recovered username from identity lookup", {
            userId: user.userId
          });
        }
      } catch (identityErr) {
        const identityMessage = identityErr instanceof Error ? identityErr.message : "unknown";
        console.warn("[instagram/sync] identity lookup failed during sync", {
          userId: user.userId,
          error: identityMessage
        });
      }
    }

    let extracted;
    let syncStatus: ProfileSyncStatus = "fresh";
    let syncReason: string | null = null;
    let reconnectRecommended = false;
    let syncMessage = "Synced from Instagram.";
    try {
      extracted = await fetchInstagramProfileForSync({
        username: resolvedUsername || "<unknown>",
        accessToken
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load Instagram profile";
      const classified = classifySyncFailure(msg);
      syncStatus = "degraded";
      syncReason = classified.reason;
      reconnectRecommended = classified.reconnectRecommended;
      syncMessage = "Showing your last saved profile values. Instagram data is temporarily unavailable.";
      extracted = {
        fullName: profile.fullName || undefined,
        followersCount: profile.followerCount,
        mediaCount: profile.postCount,
        profilePictureUrl: profile.instagramProfilePictureUrl || undefined,
        meta: {
          usedGraph: false,
          usedWebFallback: false,
          graphError: msg,
          webError: msg
        }
      };
    }

    const hasName = Boolean(extracted.fullName?.trim());
    const hasFollowers = extracted.followersCount !== undefined;
    const hasMedia = extracted.mediaCount !== undefined;
    const hasPic = Boolean(extracted.profilePictureUrl?.trim());
    const viewsTotal =
      accessToken && (hasMedia || profile.postCount > 0)
        ? await fetchInstagramMediaViewsTotal({ accessToken, pageLimit: 10, perPageLimit: 50 }).catch(() => 0)
        : 0;

    let demographics: any = null;
    if (accessToken && profile.instagramUserId) {
      try {
        demographics = await fetchInstagramAudienceDemographics({
          accessToken,
          instagramUserId: profile.instagramUserId
        });
      } catch (err) {
        console.warn("[instagram/sync] demographics fetch failed", {
          userId: user.userId,
          error: err instanceof Error ? err.message : "unknown"
        });
      }
    }

    if (!hasName && !hasFollowers && !hasMedia && !hasPic) {
      syncStatus = "failed";
      syncReason = "no_usable_data";
      syncMessage = "Instagram did not return usable profile data right now.";
      return NextResponse.json(
        {
          error: "Instagram did not return usable profile data. Try again later or check the account is public.",
          meta: {
            tokenRefreshed,
            syncStatus,
            syncReason,
            reconnectRecommended,
            syncMessage
          }
        },
        { status: 502 }
      );
    }

    const updated = await db.creatorProfile.update({
      where: { userId: user.userId },
      data: {
        ...(hasFollowers ? { followerCount: extracted.followersCount! } : {}),
        ...(hasMedia ? { postCount: extracted.mediaCount! } : {}),
        instagramViewsTotal: viewsTotal,
        ...(hasName ? { fullName: extracted.fullName!.trim() } : {}),
        ...(hasPic ? { instagramProfilePictureUrl: extracted.profilePictureUrl!.trim() } : {}),
        ...(demographics !== null ? { instagramDemographics: demographics } : {}),
        ...(resolvedUsername
          ? {
              instagramUsername: resolvedUsername,
              instagramHandle: resolvedUsername
            }
          : {}),
        instagramStatsSyncedAt: new Date()
      }
    });
    if (!resolvedUsername && syncStatus === "fresh") {
      syncStatus = "degraded";
      syncReason = "username_unresolved";
      reconnectRecommended = true;
      syncMessage = "Updated available stats, but Instagram username could not be resolved. Please reconnect Instagram.";
    }
    return NextResponse.json({
      data: updated,
      meta: {
        tokenRefreshed,
        syncStatus,
        syncReason,
        reconnectRecommended,
        syncMessage,
        profileSync: extracted.meta
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

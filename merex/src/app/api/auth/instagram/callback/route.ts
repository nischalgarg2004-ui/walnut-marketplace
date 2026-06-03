import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decodeInstagramState,
  encryptTokenForStorage,
  exchangeForLongLivedAccessToken,
  exchangeCodeForAccessToken,
  fetchInstagramIdentity,
  resolveInstagramRedirectUri,
  verifyInstagramState
} from "@/lib/integrations/instagram";
import { fetchInstagramProfileForSync } from "@/lib/integrations/instagram-public-profile";
import { createSessionToken, getSessionUser, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";
import { verifyLinkVerificationToken } from "@/lib/otp";
import { getRequestOrigin } from "@/lib/request-origin";
import { creatorProfileNeedsOnboarding } from "@/lib/creator-profile-completeness";

function syntheticEmail(igUserId: string) {
  return `ig_${igUserId}@instagram.local`;
}

function isTransientDbDisconnect(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();
  return message.includes("server has closed the connection") || message.includes("can't reach database server");
}

function roleFromStateRaw(stateRaw: string | null): "creator" | "business" | undefined {
  if (!stateRaw) return undefined;
  try {
    const decoded = decodeInstagramState(stateRaw);
    return decoded.role;
  } catch {
    return undefined;
  }
}

function isUnsupportedMethodTypeGetError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();
  return lower.includes("code=100") && lower.includes("unsupported request - method type: get");
}

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);
  const stateRawForFallback = req.nextUrl.searchParams.get("state");
  const redirectToRoleLogin = (role?: "creator" | "business") =>
    role === "business" ? "/login/business" : role === "creator" ? "/login/creator" : "/login";
  try {
    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    if (!code || !stateRaw) {
      return NextResponse.redirect(new URL("/login/creator?error=instagram_missing_code", origin));
    }
    let state;
    try {
      state = decodeInstagramState(stateRaw);
    } catch {
      return NextResponse.redirect(new URL("/login/creator?error=instagram_invalid_state", origin));
    }
    if (!verifyInstagramState(state)) {
      return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=instagram_state_mismatch`, origin));
    }

    let accessToken: string;
    let tokenExpiresAt: Date | null = null;
    let exchangedUserId: string | null = null;
    try {
      const redirectUri = resolveInstagramRedirectUri(origin);
      const shortLived = await exchangeCodeForAccessToken({ code, redirectUri });
      accessToken = shortLived.accessToken;
      exchangedUserId = shortLived.userId ?? null;
      tokenExpiresAt = buildTokenExpiryDate(60 * 60);
      try {
        const longLived = await exchangeForLongLivedAccessToken(shortLived.accessToken);
        accessToken = longLived.accessToken;
        tokenExpiresAt = buildTokenExpiryDate(longLived.expiresInSeconds);
      } catch (longLivedError) {
        if (isUnsupportedMethodTypeGetError(longLivedError)) {
          console.error("[instagram/callback] incompatible token for long-lived exchange", {
            origin,
            redirectUri,
            error: longLivedError instanceof Error ? longLivedError.message : "unknown"
          });
          return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=instagram_token_incompatible`, origin));
        }
        console.warn("[instagram/callback] long-lived token exchange failed; using short-lived token", {
          origin,
          redirectUri,
          error: longLivedError instanceof Error ? longLivedError.message : "unknown"
        });
      }
    } catch (exchangeError) {
      console.error("[instagram/callback] code exchange failed", {
        origin,
        redirectUri: resolveInstagramRedirectUri(origin),
        error: exchangeError instanceof Error ? exchangeError.message : "unknown"
      });
      return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=instagram_code_exchange_failed`, origin));
    }

    let identity;
    let usedFallbackIdentity = false;
    try {
      identity = await fetchInstagramIdentity(accessToken);
    } catch (profileError) {
      console.error("[instagram/callback] profile fetch failed", {
        origin,
        error: profileError instanceof Error ? profileError.message : "unknown"
      });
      if (!exchangedUserId) {
        return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=instagram_profile_fetch_failed`, origin));
      }
      const fallbackAccountType = state.role === "business" ? "BUSINESS" : "CREATOR";
      identity = {
        userId: exchangedUserId,
        username: `instagram_${exchangedUserId}`,
        accountType: fallbackAccountType,
        accessToken
      } as const;
      usedFallbackIdentity = true;
      console.warn("[instagram/callback] using fallback identity from code exchange user_id", {
        origin,
        userId: exchangedUserId,
        accountType: fallbackAccountType
      });
    }
    let webProfile: Awaited<ReturnType<typeof fetchInstagramProfileForSync>> | null = null;
    if (!usedFallbackIdentity) {
      try {
        webProfile = await fetchInstagramProfileForSync({
          username: identity.username,
          accessToken
        });
      } catch {
        webProfile = null;
      }
    }
    const encryptedToken = encryptTokenForStorage(accessToken);
    const existingSession = getSessionUser(req);
    const linkedProfile = await db.creatorProfile.findUnique({
      where: { instagramUserId: identity.userId },
      include: { user: true }
    });
    const linkedBusinessProfile = await db.businessProfile.findUnique({
      where: { instagramUserId: identity.userId },
      include: { user: true }
    });
    const isBusinessFlow = state.role === "business";
    let isNewAccountFromOAuth = false;
    const instagramUsernameForStorage = usedFallbackIdentity ? null : identity.username;
    const displayName = webProfile?.fullName?.trim() || (usedFallbackIdentity ? linkedProfile?.fullName ?? "Creator" : identity.username);

    let userId: string;
    if (state.mode === "connect") {
      if (!existingSession) {
        return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=connect_requires_login`, origin));
      }
      if (isBusinessFlow) {
        if (existingSession.role !== UserRole.BUSINESS) {
          return NextResponse.redirect(new URL("/login/business?error=connect_requires_business_login", origin));
        }
        const verifiedToken = req.cookies.get("business_link_verified")?.value;
        if (!verifiedToken || !verifyLinkVerificationToken(verifiedToken, existingSession.userId)) {
          return NextResponse.redirect(new URL("/business/settings?error=otp_verification_required", origin));
        }
        if (linkedBusinessProfile?.user && linkedBusinessProfile.user.id !== existingSession.userId) {
          return NextResponse.redirect(new URL("/business/settings?error=instagram_already_linked", origin));
        }
      } else if (existingSession.role !== UserRole.CREATOR) {
        return NextResponse.redirect(new URL("/login/creator?error=connect_requires_creator_login", origin));
      }
      userId = existingSession.userId;
    } else if (isBusinessFlow && linkedBusinessProfile?.user) {
      userId = linkedBusinessProfile.user.id;
    } else if (!isBusinessFlow && linkedProfile?.user) {
      userId = linkedProfile.user.id;
    } else {
      const email = isBusinessFlow ? syntheticEmail(identity.userId) : state.email ?? syntheticEmail(identity.userId);
      const existingByEmail = await db.user.findUnique({ where: { email }, select: { id: true } });
      const createdUser = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: isBusinessFlow ? UserRole.BUSINESS : UserRole.CREATOR,
          ...(isBusinessFlow
            ? {
                businessProfile: {
                  create: {
                    legalName: displayName,
                    brandName: displayName,
                    billingEmail: email,
                    representativeFullName: displayName
                  }
                }
              }
            : {
                creatorProfile: {
                  create: {
                    fullName: displayName,
                    niches: [],
                    ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
                    ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
                    ...(webProfile?.profilePictureUrl?.trim()
                      ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
                      : {}),
                    ...(webProfile?.followersCount !== undefined ||
                    webProfile?.mediaCount !== undefined ||
                    webProfile?.fullName?.trim() ||
                    webProfile?.profilePictureUrl?.trim()
                      ? { instagramStatsSyncedAt: new Date() }
                      : {})
                  }
                }
              })
        }
      });
      userId = createdUser.id;
      isNewAccountFromOAuth = !existingByEmail;
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found after Instagram callback");
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(new URL(`${redirectToRoleLogin(state.role)}?error=account_suspended`, origin));
    }

    let creatorProfileForRouting:
      | {
          fullName: string;
          niches: string[];
          instagramUsername: string | null;
          instagramProfilePictureUrl: string | null;
        }
      | null = null;

    if (!isBusinessFlow) {
      const creatorProfile = await db.creatorProfile.upsert({
        where: { userId: user.id },
        update: {
          instagramUserId: identity.userId,
          ...(instagramUsernameForStorage
            ? {
                instagramUsername: instagramUsernameForStorage,
                instagramHandle: instagramUsernameForStorage
              }
            : {}),
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt,
          ...(webProfile?.fullName?.trim() ? { fullName: webProfile.fullName.trim() } : {}),
          ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
          ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
          ...(webProfile?.profilePictureUrl?.trim()
            ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
            : {}),
          ...(webProfile?.followersCount !== undefined ||
          webProfile?.mediaCount !== undefined ||
          webProfile?.fullName?.trim() ||
          webProfile?.profilePictureUrl?.trim()
            ? { instagramStatsSyncedAt: new Date() }
            : {})
        },
        create: {
          userId: user.id,
          fullName: displayName,
          niches: [],
          instagramUserId: identity.userId,
          ...(instagramUsernameForStorage
            ? {
                instagramUsername: instagramUsernameForStorage,
                instagramHandle: instagramUsernameForStorage
              }
            : {}),
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt,
          ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
          ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
          ...(webProfile?.profilePictureUrl?.trim()
            ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
            : {}),
          ...(webProfile?.followersCount !== undefined ||
          webProfile?.mediaCount !== undefined ||
          webProfile?.profilePictureUrl?.trim()
            ? { instagramStatsSyncedAt: new Date() }
            : {})
        }
      });
      creatorProfileForRouting = {
        fullName: creatorProfile.fullName,
        niches: creatorProfile.niches,
        instagramUsername: creatorProfile.instagramUsername ?? null,
        instagramProfilePictureUrl: creatorProfile.instagramProfilePictureUrl ?? null
      };
    } else {
      await db.businessProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(webProfile?.fullName?.trim() ? { brandName: webProfile.fullName.trim(), legalName: webProfile.fullName.trim() } : {}),
          instagramUserId: identity.userId,
          instagramUsername: identity.username,
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt
        },
        create: {
          userId: user.id,
          legalName: displayName,
          brandName: displayName,
          billingEmail: user.email,
          representativeFullName: displayName,
          instagramUserId: identity.userId,
          instagramUsername: identity.username,
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt
        }
      });
    }

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });
    const nextPath =
      user.role === UserRole.BUSINESS
        ? isNewAccountFromOAuth
          ? "/signup/business?from=instagram"
          : "/business/home"
        : isNewAccountFromOAuth ||
            usedFallbackIdentity ||
            (creatorProfileForRouting ? creatorProfileNeedsOnboarding(creatorProfileForRouting) : false)
          ? "/creator/profile?onboarding=1"
          : "/creator";
    const response = NextResponse.redirect(new URL(nextPath, origin));
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieSecure(req),
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    response.cookies.set("instagram_oauth_nonce", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    response.cookies.set("business_link_verified", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return response;
  } catch (error) {
    console.error("[instagram/callback]", error);
    const fallbackRole = roleFromStateRaw(stateRawForFallback);
    if (isTransientDbDisconnect(error)) {
      return NextResponse.redirect(
        new URL(`${redirectToRoleLogin(fallbackRole)}?error=instagram_temporary_unavailable`, origin)
      );
    }
    return NextResponse.redirect(
      new URL(`${redirectToRoleLogin(fallbackRole)}?error=instagram_callback_failed`, origin)
    );
  }
}

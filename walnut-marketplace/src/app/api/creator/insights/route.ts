import { NextRequest, NextResponse } from "next/server";
import { requireCreatorProfile } from "@/lib/creator-access";
import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decryptTokenFromStorage,
  encryptTokenForStorage,
  fetchMediaInsightsWithPolicy,
  fetchInstagramIdentity,
  fetchInstagramMediaList,
  refreshLongLivedAccessToken,
  shouldRefreshInstagramToken
} from "@/lib/integrations/instagram";

async function runInsights(req: NextRequest) {
  const { creatorProfileId } = await requireCreatorProfile(req);
  const profile = await db.creatorProfile.findUnique({ where: { id: creatorProfileId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (!profile.instagramAccessTokenEncrypted) {
    return NextResponse.json({ error: "INSTAGRAM_NOT_CONNECTED" }, { status: 412 });
  }

  let accessToken = decryptTokenFromStorage(profile.instagramAccessTokenEncrypted);
  if (!accessToken) {
    return NextResponse.json({ error: "INSTAGRAM_TOKEN_INVALID" }, { status: 412 });
  }

  let tokenRefreshed = false;
  if (profile.instagramTokenExpiresAt && shouldRefreshInstagramToken(profile.instagramTokenExpiresAt)) {
    try {
      const refreshed = await refreshLongLivedAccessToken(accessToken);
      accessToken = refreshed.accessToken;
      tokenRefreshed = true;
      await db.creatorProfile.update({
        where: { id: profile.id },
        data: {
          instagramAccessTokenEncrypted: encryptTokenForStorage(refreshed.accessToken),
          instagramTokenExpiresAt: buildTokenExpiryDate(refreshed.expiresInSeconds)
        }
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to refresh Instagram token" },
        { status: 502 }
      );
    }
  }

  const identity = await fetchInstagramIdentity(accessToken).catch(() => null);
  if (!identity) {
    return NextResponse.json({ error: "Could not fetch Instagram identity" }, { status: 502 });
  }

  const media = await fetchInstagramMediaList({ accessToken, limit: 10 }).catch(() => []);
  const selectedMediaIdFromQuery = req.nextUrl.searchParams.get("mediaId")?.trim();
  const selected = media.find((m) => m.id === selectedMediaIdFromQuery) ?? media[0] ?? null;
  const insightsResult = selected
    ? await fetchMediaInsightsWithPolicy({
        accessToken,
        mediaId: selected.id,
        mediaType: selected.mediaType
      })
    : {
        requestedMetrics: [] as string[],
        returnedMetrics: [] as string[],
        unsupportedMetrics: [] as string[],
        classification: "NO_DATA_YET" as const,
        status: "NO_DATA" as const,
        rows: [] as Array<{
          name: string;
          period?: string;
          values?: Array<{ value?: number }>;
          title?: string;
          description?: string;
        }>
      };

  return NextResponse.json({
    data: {
      account: {
        instagramUserId: identity.userId,
        username: identity.username,
        accountType: identity.accountType,
        followerCount: profile.followerCount,
        postCount: profile.postCount
      },
      latestMedia: media,
      selectedMediaId: selected?.id ?? null,
      selectedMediaPermalink: selected?.permalink ?? null,
      selectedMediaType: selected?.mediaType ?? null,
      insights: insightsResult.rows,
      diagnostics: {
        requestedMetrics: insightsResult.requestedMetrics,
        returnedMetrics: insightsResult.returnedMetrics,
        unsupportedMetrics: insightsResult.unsupportedMetrics,
        classification: insightsResult.classification,
        status: insightsResult.status,
        errorMessage: insightsResult.errorMessage
      },
      tokenRefreshed,
      fetchedAt: new Date().toISOString()
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    return await runInsights(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await runInsights(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decryptTokenFromStorage,
  encryptTokenForStorage,
  refreshLongLivedAccessToken,
  resolveInstagramMediaIdFromPermalink,
  shouldRefreshInstagramToken
} from "@/lib/integrations/instagram";
import {
  classifyProbeResult,
  probeInstagramMediaInsights,
  probeInstagramMediaList,
  probeInstagramMe,
  type InstagramProbeResponse
} from "@/lib/integrations/instagram-tester";

const bodySchema = z.object({
  creatorProfileId: z.string().min(8).optional(),
  creatorUserId: z.string().min(8).optional(),
  instagramUsername: z.string().min(1).optional(),
  mediaSelectionMode: z.enum(["latest_media", "manual_media_id", "permalink_resolution"]).default("latest_media"),
  manualMediaId: z.string().min(5).optional(),
  permalink: z.string().url().optional(),
  metrics: z.array(z.string().min(1)).max(15).optional()
});

const DEFAULT_METRICS = ["reach", "likes", "comments", "saved", "shares", "views"];

function docsLinks() {
  return [
    "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/",
    "https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/"
  ];
}

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);
    const body = bodySchema.parse(await req.json());

    const where = body.creatorProfileId
      ? { id: body.creatorProfileId }
      : body.creatorUserId
        ? { userId: body.creatorUserId }
        : body.instagramUsername
          ? { instagramUsername: body.instagramUsername.replace(/^@/, "").trim().toLowerCase() }
          : undefined;

    const profile = await db.creatorProfile.findFirst({
      where: where ?? { instagramAccessTokenEncrypted: { not: null } },
      orderBy: { instagramConnectedAt: "desc" }
    });

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          classification: "TOKEN_MISSING",
          timestamp: new Date().toISOString(),
          uiHints: {
            remediation: ["No creator profile matched. Provide profile/user/username with connected Instagram token."],
            docsLinks: docsLinks()
          }
        } satisfies Partial<InstagramProbeResponse>,
        { status: 404 }
      );
    }

    let accessToken = profile.instagramAccessTokenEncrypted
      ? decryptTokenFromStorage(profile.instagramAccessTokenEncrypted)
      : null;
    let refreshed = false;
    let refreshError: string | undefined;
    if (accessToken && shouldRefreshInstagramToken(profile.instagramTokenExpiresAt)) {
      try {
        const bundle = await refreshLongLivedAccessToken(accessToken);
        accessToken = bundle.accessToken;
        refreshed = true;
        await db.creatorProfile.update({
          where: { id: profile.id },
          data: {
            instagramAccessTokenEncrypted: encryptTokenForStorage(bundle.accessToken),
            instagramTokenExpiresAt: buildTokenExpiryDate(bundle.expiresInSeconds)
          }
        });
      } catch (err) {
        refreshError = err instanceof Error ? err.message : "refresh_failed";
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          target: {
            creatorProfileId: profile.id,
            instagramUserId: profile.instagramUserId ?? undefined,
            instagramUsername: profile.instagramUsername ?? undefined
          },
          token: {
            present: false,
            expiresAt: profile.instagramTokenExpiresAt?.toISOString(),
            refreshed
          },
          classification: "TOKEN_MISSING",
          timestamp: new Date().toISOString(),
          uiHints: {
            remediation: ["Reconnect Instagram for this creator account on the deployed domain and retry."],
            docsLinks: docsLinks()
          }
        } satisfies Partial<InstagramProbeResponse>,
        { status: 400 }
      );
    }

    const me = await probeInstagramMe(accessToken);
    const mediaList = await probeInstagramMediaList(accessToken);

    let selectedMediaId: string | undefined;
    if (body.mediaSelectionMode === "manual_media_id" && body.manualMediaId) {
      selectedMediaId = body.manualMediaId;
    } else if (body.mediaSelectionMode === "permalink_resolution" && body.permalink) {
      selectedMediaId = (await resolveInstagramMediaIdFromPermalink({
        accessToken,
        permalink: body.permalink
      })) ?? undefined;
    } else if (body.mediaSelectionMode === "latest_media") {
      selectedMediaId = mediaList.sampleMediaIds?.[0];
    }

    const metrics = body.metrics && body.metrics.length > 0 ? body.metrics : DEFAULT_METRICS;
    const insights = selectedMediaId
      ? await probeInstagramMediaInsights(accessToken, selectedMediaId, metrics)
      : {
          ok: false,
          latencyMs: 0,
          metricRequest: metrics,
          error: { message: "No media selected for insights probe" }
        };

    const response: InstagramProbeResponse = {
      ok: me.ok && mediaList.ok && insights.ok,
      checks: {
        me,
        mediaList,
        mediaSelection: {
          selectedMediaId,
          selectionMode: selectedMediaId ? body.mediaSelectionMode : "none"
        },
        insights
      },
      classification: "UNKNOWN_FAILURE",
      timestamp: new Date().toISOString()
    };
    response.classification = classifyProbeResult(response);
    response.uiHints = {
      remediation:
        response.classification === "SUCCESS"
          ? ["Probe passed. Graph endpoints are reachable with the current token and media selection."]
          : [
              "Ensure Instagram Login scopes include insights permissions for this app/user.",
              "Reconnect Instagram on the deployed domain if token appears expired or invalid."
            ],
      docsLinks: docsLinks()
    };

    return NextResponse.json({
      ...response,
      target: {
        creatorProfileId: profile.id,
        instagramUserId: profile.instagramUserId ?? undefined,
        instagramUsername: profile.instagramUsername ?? undefined
      },
      token: {
        present: true,
        expiresAt: profile.instagramTokenExpiresAt?.toISOString(),
        refreshed,
        refreshError
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


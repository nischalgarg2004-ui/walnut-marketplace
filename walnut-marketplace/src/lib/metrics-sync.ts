import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decryptTokenFromStorage,
  encryptTokenForStorage,
  resolveInstagramMediaIdFromPermalink,
  refreshLongLivedAccessToken,
  shouldRefreshInstagramToken
} from "@/lib/integrations/instagram";

const IG_VERSION = "v25.0";

export async function fetchMediaViewsFromInstagram(
  instagramMediaId: string,
  accessToken: string
): Promise<
  | { views: number; likes: number | null; comments: number | null; shares: number | null; raw: unknown }
  | { error: string; raw?: unknown }
  | null
> {
  const url = new URL(`https://graph.instagram.com/${IG_VERSION}/${instagramMediaId}/insights`);
  url.searchParams.set("metric", "views,likes,comments,shares");
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), { method: "GET", next: { revalidate: 0 } });
  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = (await res.json()) as unknown;
    } catch {
      raw = null;
    }
    return {
      error: `instagram_graph_http_${res.status}`,
      raw
    };
  }
  const json = (await res.json()) as {
    data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
  };
  const metricMap = new Map<string, number>();
  for (const row of json.data ?? []) {
    if (!row?.name) continue;
    const value = row.values?.[0]?.value;
    if (typeof value === "number") {
      metricMap.set(row.name, value);
    }
  }
  const views = metricMap.get("views");
  if (typeof views !== "number") {
    return { error: "instagram_graph_missing_views_value", raw: json };
  }
  const likes = metricMap.get("likes") ?? null;
  const comments = metricMap.get("comments") ?? null;
  const shares = metricMap.get("shares") ?? null;
  return {
    views,
    likes,
    comments,
    shares,
    raw: {
      source: "INSTAGRAM_GRAPH_INSIGHTS",
      metrics: {
        views,
        likes,
        comments,
        shares
      },
      raw: json
    }
  };
}

function reportStatusForSource(source: string): string {
  if (source === "INSTAGRAM_GRAPH") return "VERIFIED";
  if (source === "INSTAGRAM_GRAPH_UNAVAILABLE") return "FAILED";
  if (source === "PERFORMANCE_REPORT") return "PENDING";
  return "PENDING";
}

export async function syncContractMetrics(
  contractId: string
): Promise<{ views: number; source: string; likes?: number | null; comments?: number | null; shares?: number | null; message?: string } | null> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      creator: true,
      deliverables: { orderBy: { submittedAt: "desc" } },
      performanceReport: true
    }
  });
  if (!contract || contract.status !== "ACTIVE") {
    return null;
  }

  const submittedReelDeliverable =
    contract.deliverables.find((d) => d.expectedKind === "REEL" && d.externalUrl?.trim()) ??
    contract.deliverables.find((d) => d.externalUrl?.trim()) ??
    null;
  const externalUrl = submittedReelDeliverable?.externalUrl?.trim() ?? null;

  let mediaId =
    submittedReelDeliverable?.instagramMediaId ??
    contract.deliverables.find((d) => d.instagramMediaId)?.instagramMediaId;
  const tokenEnc = contract.creator.instagramAccessTokenEncrypted;
  let token = decryptTokenFromStorage(tokenEnc) ?? process.env.GRAPH_API_TOKEN ?? null;
  if (token && contract.creator.instagramTokenExpiresAt && shouldRefreshInstagramToken(contract.creator.instagramTokenExpiresAt)) {
    try {
      const refreshed = await refreshLongLivedAccessToken(token);
      token = refreshed.accessToken;
      await db.creatorProfile.update({
        where: { id: contract.creator.id },
        data: {
          instagramAccessTokenEncrypted: encryptTokenForStorage(refreshed.accessToken),
          instagramTokenExpiresAt: buildTokenExpiryDate(refreshed.expiresInSeconds)
        }
      });
      console.info("[metrics-sync] refreshed Instagram token", { contractId, creatorId: contract.creator.id });
    } catch (err) {
      console.warn("[metrics-sync] Instagram token refresh failed", {
        contractId,
        creatorId: contract.creator.id,
        error: err instanceof Error ? err.message : "unknown"
      });
    }
  }

  let views = contract.performanceReport?.viewsCount ?? 0;
  let likes: number | null = null;
  let comments: number | null = null;
  let shares: number | null = null;
  let source = "PERFORMANCE_REPORT";
  let rawJson: unknown = null;
  let graphUnavailableSubcode: number | undefined;

  const tryGraph = async (): Promise<boolean> => {
    if (!token) return false;
    if (!mediaId && externalUrl) {
      try {
        const resolved = await resolveInstagramMediaIdFromPermalink({
          accessToken: token,
          permalink: externalUrl
        });
        if (resolved) {
          mediaId = resolved;
          const deliverableToUpdate = submittedReelDeliverable ?? contract.deliverables.find((d) => d.externalUrl?.trim() === externalUrl);
          if (deliverableToUpdate) {
            await db.deliverable.update({
              where: { id: deliverableToUpdate.id },
              data: { instagramMediaId: resolved }
            });
          }
          console.info("[metrics-sync] resolved media id from permalink", {
            contractId,
            mediaId: resolved
          });
        }
      } catch (err) {
        console.warn("[metrics-sync] media id resolve failed", {
          contractId,
          error: err instanceof Error ? err.message : "unknown"
        });
      }
    }
    if (!mediaId) return false;
    const ig = await fetchMediaViewsFromInstagram(mediaId, token);
    if (!ig) return false;
    if ("error" in ig) {
      const rawError = (ig.raw as { error?: { code?: number; error_subcode?: number; message?: string } } | null)?.error;
      graphUnavailableSubcode = rawError?.error_subcode;
      console.warn("[metrics-sync] graph insights unavailable", {
        contractId,
        mediaId,
        error: ig.error,
        raw: ig.raw ?? null
      });
      return false;
    }
    views = ig.views;
    likes = ig.likes;
    comments = ig.comments;
    shares = ig.shares;
    source = "INSTAGRAM_GRAPH";
    rawJson = ig.raw;
    return true;
  };

  const graphHit = await tryGraph();
  if (!graphHit) {
    views = contract.performanceReport?.viewsCount ?? 0;
    source = "INSTAGRAM_GRAPH_UNAVAILABLE";
    rawJson = {
      error: "instagram_graph_unavailable",
      hasToken: Boolean(token),
      hasMediaId: Boolean(mediaId),
      hasExternalUrl: Boolean(externalUrl),
      metrics: {
        views,
        likes: null,
        comments: null,
        shares: null
      }
    };
  }

  const status = reportStatusForSource(source);

  await db.metricSnapshot.create({
    data: {
      contractId,
      source,
      views,
      rawJson: rawJson ?? undefined
    }
  });

  await db.performanceReport.upsert({
    where: { contractId },
    create: {
      contractId,
      creatorId: contract.creatorId,
      source,
      viewsCount: views,
      status
    },
    update: {
      viewsCount: views,
      source,
      status
    }
  });

  const message =
    source === "INSTAGRAM_GRAPH_UNAVAILABLE"
      ? graphUnavailableSubcode === 2108006
        ? "This reel was posted before the account switched to a professional profile. Please submit a newer reel posted after conversion."
        : !token
          ? "Instagram Graph metrics unavailable: missing Instagram token. Reconnect Instagram and retry."
          : !mediaId
            ? "Instagram Graph metrics unavailable: could not resolve submitted reel media ID."
            : "Instagram Graph metrics were unavailable for the submitted reel. Using last known metrics fallback."
      : source === "INSTAGRAM_GRAPH"
        ? "Metrics sourced from Instagram Graph API."
        : undefined;
  console.info("[metrics-sync] metrics synced", { contractId, source, views });
  return { views, source, likes, comments, shares, message };
}

export async function syncAllActiveContracts(limit = 50): Promise<{ processed: number; errors: string[] }> {
  const contracts = await db.contract.findMany({
    where: { status: "ACTIVE" },
    take: limit,
    orderBy: { acceptedAt: "asc" }
  });
  const errors: string[] = [];
  let processed = 0;
  for (const c of contracts) {
    try {
      await syncContractMetrics(c.id);
      processed += 1;
    } catch (e) {
      errors.push(`${c.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return { processed, errors };
}

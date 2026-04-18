import { db } from "@/lib/db";
import { decryptTokenFromStorage } from "@/lib/token-crypto";

const IG_VERSION = "v25.0";

export async function fetchMediaViewsFromInstagram(
  instagramMediaId: string,
  accessToken: string
): Promise<{ views: number; raw: unknown } | null> {
  const url = new URL(`https://graph.instagram.com/${IG_VERSION}/${instagramMediaId}/insights`);
  url.searchParams.set("metric", "views");
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), { method: "GET", next: { revalidate: 0 } });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as {
    data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
  };
  const row = json.data?.[0];
  const v = row?.values?.[0]?.value;
  if (typeof v !== "number") {
    return null;
  }
  return { views: v, raw: json };
}

export async function syncContractMetrics(contractId: string): Promise<{ views: number; source: string } | null> {
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
  const mediaId = contract.deliverables.find((d) => d.instagramMediaId)?.instagramMediaId;
  const tokenEnc = contract.creator.instagramAccessTokenEncrypted;
  const token = decryptTokenFromStorage(tokenEnc);
  let views = 0;
  let source = "FALLBACK_PERFORMANCE_REPORT";
  let rawJson: unknown = null;

  if (mediaId && token) {
    const ig = await fetchMediaViewsFromInstagram(mediaId, token);
    if (ig) {
      views = ig.views;
      source = "INSTAGRAM_GRAPH";
      rawJson = ig.raw;
    }
  }

  if (!mediaId || source !== "INSTAGRAM_GRAPH") {
    views = contract.performanceReport?.viewsCount ?? 0;
    source = "PERFORMANCE_REPORT";
  }

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
      status: source === "INSTAGRAM_GRAPH" ? "VERIFIED" : "PENDING"
    },
    update: {
      viewsCount: views,
      source,
      status: source === "INSTAGRAM_GRAPH" ? "VERIFIED" : "PENDING"
    }
  });

  return { views, source };
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

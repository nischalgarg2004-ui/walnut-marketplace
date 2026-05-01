const GRAPH_VERSION = "v25.0";

type ProbeError = {
  code?: number;
  type?: string;
  message: string;
};

type ProbeStepBase = {
  ok: boolean;
  httpStatus?: number;
  latencyMs: number;
  error?: ProbeError;
};

export type InstagramProbeCheckMe = ProbeStepBase & {
  data?: {
    id?: string;
    user_id?: string;
    username?: string;
    account_type?: string;
  };
};

export type InstagramProbeCheckMediaList = ProbeStepBase & {
  count?: number;
  sampleMediaIds?: string[];
  samplePermalinks?: string[];
};

export type InstagramProbeCheckInsights = ProbeStepBase & {
  metricRequest?: string[];
  metricsReturned?: string[];
  raw?: unknown;
};

export type InstagramProbeClassification =
  | "SUCCESS"
  | "TOKEN_MISSING"
  | "TOKEN_EXPIRED_OR_INVALID"
  | "PERMISSION_SCOPE_GAP"
  | "INSIGHTS_UNAVAILABLE_FOR_MEDIA"
  | "NO_MEDIA_FOUND"
  | "UNKNOWN_FAILURE";

export type InstagramProbeResponse = {
  ok: boolean;
  target?: {
    creatorProfileId?: string;
    instagramUserId?: string;
    instagramUsername?: string;
  };
  token?: {
    present: boolean;
    expiresAt?: string;
    refreshed: boolean;
    refreshError?: string;
  };
  checks: {
    me: InstagramProbeCheckMe;
    mediaList: InstagramProbeCheckMediaList;
    mediaSelection: {
      selectedMediaId?: string;
      selectionMode: "manual_media_id" | "permalink_resolution" | "latest_media" | "none";
    };
    insights: InstagramProbeCheckInsights;
  };
  classification: InstagramProbeClassification;
  timestamp: string;
  uiHints?: { remediation: string[]; docsLinks: string[] };
};

function toError(raw: unknown, fallback: string): ProbeError {
  const e = (raw as { error?: { code?: number; type?: string; message?: string } } | null)?.error;
  if (e?.message) {
    return { code: e.code, type: e.type, message: e.message };
  }
  return { message: fallback };
}

async function timedFetch(url: URL): Promise<{ status: number; ms: number; json: unknown; ok: boolean }> {
  const started = Date.now();
  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return {
    status: res.status,
    ms: Date.now() - started,
    json,
    ok: res.ok
  };
}

export async function probeInstagramMe(accessToken: string): Promise<InstagramProbeCheckMe> {
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me`);
  url.searchParams.set("fields", "id,user_id,username,account_type");
  url.searchParams.set("access_token", accessToken);
  const out = await timedFetch(url);
  if (!out.ok) {
    return {
      ok: false,
      httpStatus: out.status,
      latencyMs: out.ms,
      error: toError(out.json, "Failed to fetch /me")
    };
  }
  const data = out.json as { id?: string; user_id?: string; username?: string; account_type?: string };
  return {
    ok: true,
    httpStatus: out.status,
    latencyMs: out.ms,
    data
  };
}

export async function probeInstagramMediaList(accessToken: string): Promise<InstagramProbeCheckMediaList> {
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me/media`);
  url.searchParams.set("fields", "id,permalink");
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", accessToken);
  const out = await timedFetch(url);
  if (!out.ok) {
    return {
      ok: false,
      httpStatus: out.status,
      latencyMs: out.ms,
      error: toError(out.json, "Failed to fetch /me/media")
    };
  }
  const rows = ((out.json as { data?: Array<{ id?: string; permalink?: string }> }).data ?? []).filter(Boolean);
  return {
    ok: true,
    httpStatus: out.status,
    latencyMs: out.ms,
    count: rows.length,
    sampleMediaIds: rows.slice(0, 5).map((r) => r.id).filter((v): v is string => typeof v === "string"),
    samplePermalinks: rows.slice(0, 5).map((r) => r.permalink).filter((v): v is string => typeof v === "string")
  };
}

export async function probeInstagramMediaInsights(
  accessToken: string,
  mediaId: string,
  metrics: string[]
): Promise<InstagramProbeCheckInsights> {
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/${mediaId}/insights`);
  url.searchParams.set("metric", metrics.join(","));
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", accessToken);
  const out = await timedFetch(url);
  if (!out.ok) {
    return {
      ok: false,
      httpStatus: out.status,
      latencyMs: out.ms,
      metricRequest: metrics,
      error: toError(out.json, "Failed to fetch media insights"),
      raw: out.json
    };
  }
  const rows = ((out.json as { data?: Array<{ name?: string }> }).data ?? []).filter(Boolean);
  return {
    ok: true,
    httpStatus: out.status,
    latencyMs: out.ms,
    metricRequest: metrics,
    metricsReturned: rows.map((r) => r.name).filter((v): v is string => typeof v === "string"),
    raw: out.json
  };
}

export function classifyProbeResult(result: InstagramProbeResponse): InstagramProbeClassification {
  if (!result.checks.me.ok) {
    const code = result.checks.me.error?.code;
    if (code === 190) return "TOKEN_EXPIRED_OR_INVALID";
    if (code === 10 || code === 200) return "PERMISSION_SCOPE_GAP";
    return "UNKNOWN_FAILURE";
  }
  if (!result.checks.mediaList.ok) {
    const code = result.checks.mediaList.error?.code;
    if (code === 190) return "TOKEN_EXPIRED_OR_INVALID";
    if (code === 10 || code === 200) return "PERMISSION_SCOPE_GAP";
    return "UNKNOWN_FAILURE";
  }
  if ((result.checks.mediaList.count ?? 0) === 0) return "NO_MEDIA_FOUND";
  if (!result.checks.insights.ok) {
    const code = result.checks.insights.error?.code;
    if (code === 190) return "TOKEN_EXPIRED_OR_INVALID";
    if (code === 10 || code === 200) return "PERMISSION_SCOPE_GAP";
    return "INSIGHTS_UNAVAILABLE_FOR_MEDIA";
  }
  return "SUCCESS";
}


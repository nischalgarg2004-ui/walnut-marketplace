import crypto from "crypto";

export type InstagramIdentity = {
  userId: string;
  username: string;
  accountType: "CREATOR" | "BUSINESS";
  accessToken: string;
};

export type InstagramTokenBundle = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType?: string;
};

export type InstagramCodeExchangeResult = {
  accessToken: string;
  userId?: string;
};

type StatePayload = {
  mode: "login" | "signup" | "connect";
  email?: string;
  role?: "creator" | "business";
  nonce: string;
  issuedAt: number;
  sig: string;
};

const GRAPH_VERSION = "v25.0";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function getInstagramStateSecret(): string {
  return process.env.SESSION_SECRET ?? getRequiredEnv("INSTAGRAM_CLIENT_SECRET");
}

function signInstagramStatePayload(payload: Omit<StatePayload, "sig">): string {
  const secret = getInstagramStateSecret();
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("base64url");
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function encodeInstagramState(payload: StatePayload): string {
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeInstagramState(encoded: string): StatePayload {
  const parsed = JSON.parse(base64UrlDecode(encoded)) as StatePayload;
  if (!parsed.mode || !parsed.nonce) {
    throw new Error("Invalid Instagram state");
  }
  return parsed;
}

export function createInstagramState(params: {
  mode: "login" | "signup" | "connect";
  email?: string;
  role?: "creator" | "business";
  nonce: string;
}): string {
  const unsigned = {
    mode: params.mode,
    email: params.email,
    role: params.role,
    nonce: params.nonce,
    issuedAt: Date.now()
  } as const;
  const state: StatePayload = {
    ...unsigned,
    sig: signInstagramStatePayload(unsigned)
  };
  return encodeInstagramState(state);
}

export function verifyInstagramState(state: StatePayload, maxAgeMs = 15 * 60 * 1000): boolean {
  if (!state.sig || typeof state.issuedAt !== "number") return false;
  if (Date.now() - state.issuedAt > maxAgeMs) return false;
  if (state.issuedAt > Date.now() + 60_000) return false;
  const expected = signInstagramStatePayload({
    mode: state.mode,
    email: state.email,
    role: state.role,
    nonce: state.nonce,
    issuedAt: state.issuedAt
  });
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(state.sig));
}

export function buildInstagramAuthorizeUrl(state: string): string {
  return buildInstagramAuthorizeUrlWithRedirectUri({
    state
  });
}

export function buildInstagramAuthorizeUrlWithRedirectUri({
  state,
  redirectUri
}: {
  state: string;
  redirectUri?: string;
}): string {
  const clientId = getRequiredEnv("INSTAGRAM_CLIENT_ID");
  const resolvedRedirectUri = redirectUri ?? getRequiredEnv("INSTAGRAM_REDIRECT_URI");
  const scope = process.env.INSTAGRAM_SCOPE?.trim() || "instagram_business_basic";
  const url = new URL("https://api.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", resolvedRedirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  return url.toString();
}

export function resolveInstagramRedirectUri(origin?: string): string {
  const configured = process.env.INSTAGRAM_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }
  if (!origin) {
    throw new Error("Unable to resolve Instagram redirect URI");
  }
  return new URL("/api/auth/instagram/callback", origin).toString();
}

/** Normalize Graph `/me` JSON (object or `{ data: [...] }`) into a single row. */
function parseInstagramMeRow(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.data) && o.data.length > 0 && typeof o.data[0] === "object") {
    return o.data[0] as Record<string, unknown>;
  }
  return o;
}

export async function exchangeCodeForAccessToken(opts: { code: string; redirectUri?: string }): Promise<InstagramCodeExchangeResult> {
  const clientId = getRequiredEnv("INSTAGRAM_CLIENT_ID");
  const clientSecret = getRequiredEnv("INSTAGRAM_CLIENT_SECRET");
  const redirectUri = opts.redirectUri ?? getRequiredEnv("INSTAGRAM_REDIRECT_URI");
  const tokenUrl = "https://api.instagram.com/oauth/access_token";
  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);
  body.set("code", opts.code);

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Instagram code");
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string; user_id?: string | number };
  if (!tokenJson.access_token) {
    throw new Error("Instagram access token missing");
  }
  return {
    accessToken: tokenJson.access_token,
    ...(tokenJson.user_id !== undefined ? { userId: String(tokenJson.user_id) } : {})
  };
}

export async function exchangeForLongLivedAccessToken(shortLivedToken: string): Promise<InstagramTokenBundle> {
  const clientSecret = getRequiredEnv("INSTAGRAM_CLIENT_SECRET");
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("access_token", shortLivedToken);
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; code?: number; type?: string } };
      if (errBody.error?.message) {
        const code = errBody.error.code !== undefined ? ` code=${errBody.error.code}` : "";
        const type = errBody.error.type ? ` type=${errBody.error.type}` : "";
        detail = `${code}${type} message=${errBody.error.message}`;
      }
    } catch {
      /* ignore */
    }
    throw new Error(
      detail ? `Failed to exchange long-lived Instagram token (${detail})` : "Failed to exchange long-lived Instagram token"
    );
  }
  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };
  if (!json.access_token || typeof json.expires_in !== "number") {
    throw new Error("Invalid long-lived Instagram token response");
  }
  return {
    accessToken: json.access_token,
    expiresInSeconds: json.expires_in,
    tokenType: json.token_type
  };
}

export async function refreshLongLivedAccessToken(accessToken: string): Promise<InstagramTokenBundle> {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; code?: number; type?: string } };
      if (errBody.error?.message) {
        const code = errBody.error.code !== undefined ? ` code=${errBody.error.code}` : "";
        const type = errBody.error.type ? ` type=${errBody.error.type}` : "";
        detail = `${code}${type} message=${errBody.error.message}`;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail ? `Failed to refresh Instagram token (${detail})` : "Failed to refresh Instagram token");
  }
  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };
  if (!json.access_token || typeof json.expires_in !== "number") {
    throw new Error("Invalid refreshed Instagram token response");
  }
  return {
    accessToken: json.access_token,
    expiresInSeconds: json.expires_in,
    tokenType: json.token_type
  };
}

export function buildTokenExpiryDate(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

export function shouldRefreshInstagramToken(
  expiresAt: Date | null | undefined,
  refreshWindowDays = 14
): boolean {
  if (!expiresAt) return true;
  const msLeft = expiresAt.getTime() - Date.now();
  return msLeft <= refreshWindowDays * 24 * 60 * 60 * 1000;
}

/** Optional fields from Graph `/me` for connected accounts (avoids public-page / datacenter blocks). */
export type InstagramGraphMeFields = {
  profileName?: string;
  followersCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
};

type GraphMediaListResponse = {
  data?: Array<{ id?: string; permalink?: string; media_type?: string; timestamp?: string }>;
  paging?: { next?: string };
};

export type InstagramMediaRow = {
  id: string;
  permalink?: string;
  mediaType?: string;
  timestamp?: string;
};

export type InstagramInsightsRow = {
  name: string;
  period?: string;
  values?: Array<{ value?: number }>;
  title?: string;
  description?: string;
};

export type InsightsDisplayStatus = "COMPLETE" | "PARTIAL" | "NO_DATA" | "ERROR";

export type InstagramInsightsFetchResult = {
  requestedMetrics: string[];
  returnedMetrics: string[];
  unsupportedMetrics: string[];
  classification:
    | "OK"
    | "NO_DATA_YET"
    | "UNSUPPORTED_FOR_MEDIA_TYPE"
    | "TOKEN_SCOPE_GAP"
    | "TOKEN_INVALID"
    | "API_ERROR";
  status: InsightsDisplayStatus;
  rows: InstagramInsightsRow[];
  errorMessage?: string;
};

/**
 * Fetches name, follower/post counts, and profile picture when the app token allows it.
 * Retries with fewer fields if optional ones cause HTTP 400.
 */
export async function fetchInstagramGraphMeFields(accessToken: string): Promise<InstagramGraphMeFields> {
  const tryFields = async (fields: string): Promise<InstagramGraphMeFields> => {
    const meUrl = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me`);
    meUrl.searchParams.set("fields", fields);
    meUrl.searchParams.set("access_token", accessToken);
    const meRes = await fetch(meUrl, { method: "GET", cache: "no-store" });
    if (!meRes.ok) {
      return {};
    }
    const raw = (await meRes.json()) as unknown;
    const row = parseInstagramMeRow(raw);
    if (!row) return {};
    const name = typeof row.name === "string" ? row.name.trim() : undefined;
    const num = (v: unknown): number | undefined => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number.parseInt(v.replace(/,/g, ""), 10);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };
    const pic =
      typeof row.profile_picture_url === "string"
        ? row.profile_picture_url
        : typeof (row as { profile_pic_url?: string }).profile_pic_url === "string"
          ? (row as { profile_pic_url: string }).profile_pic_url
          : undefined;
    return {
      profileName: name,
      followersCount: num(row.followers_count),
      mediaCount: num(row.media_count),
      profilePictureUrl: pic
    };
  };

  const wide = await tryFields("name,followers_count,media_count,profile_picture_url");
  if (
    wide.profileName !== undefined ||
    wide.followersCount !== undefined ||
    wide.mediaCount !== undefined ||
    wide.profilePictureUrl !== undefined
  ) {
    return wide;
  }
  return tryFields("name,followers_count,media_count");
}

export async function fetchInstagramIdentity(accessToken: string): Promise<InstagramIdentity> {
  type MeRow = { id?: string; user_id?: string; username?: string; account_type?: string };
  const candidateUrls = [
    `https://graph.instagram.com/${GRAPH_VERSION}/me`,
    "https://graph.instagram.com/me"
  ];
  const candidateFields = ["id,username,account_type", "id,username"];
  let row: MeRow | undefined;
  let lastError = "Failed to fetch Instagram profile";
  for (const base of candidateUrls) {
    for (const fields of candidateFields) {
      const meUrl = new URL(base);
      meUrl.searchParams.set("fields", fields);
      meUrl.searchParams.set("access_token", accessToken);
      const meRes = await fetch(meUrl, { method: "GET" });
      if (!meRes.ok) {
        try {
          const errBody = (await meRes.json()) as { error?: { message?: string; code?: number } };
          if (errBody?.error?.message) lastError = errBody.error.message;
        } catch {
          /* ignore */
        }
        continue;
      }
      const raw = (await meRes.json()) as unknown;
      const flat = parseInstagramMeRow(raw);
      row = flat as MeRow | undefined;
      if (row?.id && row?.username) break;
    }
    if (row?.id && row?.username) break;
  }
  if (!row?.id || !row?.username) {
    console.error(`Instagram /me lookup failed: ${lastError}`);
    throw new Error("Failed to fetch Instagram profile");
  }
  const normalizedType = row?.account_type?.toUpperCase().replace(/\s+/g, "_");
  const accountType =
    normalizedType === "MEDIA_CREATOR" || normalizedType === "CREATOR"
      ? "CREATOR"
      : normalizedType === "BUSINESS"
        ? "BUSINESS"
        : "CREATOR";
  const userId = row?.user_id ?? row?.id;
  const username = row?.username;

  if (!userId || !username) {
    throw new Error("Instagram Professional account required");
  }
  return {
    userId,
    username,
    accountType,
    accessToken
  };
}

function normalizePermalink(input: string): string {
  try {
    const url = new URL(input.trim());
    url.search = "";
    url.hash = "";
    const pathname = url.pathname.replace(/\/+$/, "");
    return `https://www.instagram.com${pathname}/`;
  } catch {
    return input.trim();
  }
}

export async function resolveInstagramMediaIdFromPermalink(opts: {
  accessToken: string;
  permalink: string;
  maxPages?: number;
}): Promise<string | null> {
  const target = normalizePermalink(opts.permalink);
  const maxPages = Math.max(1, Math.min(opts.maxPages ?? 5, 20));
  let nextUrl: string | null = null;
  let page = 0;

  while (page < maxPages) {
    const url = nextUrl
      ? new URL(nextUrl)
      : new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me/media?fields=id,permalink&limit=50`);
    if (!nextUrl) {
      url.searchParams.set("access_token", opts.accessToken);
    }
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as GraphMediaListResponse;
    const found = json.data?.find((row) => row.permalink && normalizePermalink(row.permalink) === target);
    if (found?.id) return found.id;
    nextUrl = json.paging?.next ?? null;
    if (!nextUrl) break;
    page += 1;
  }
  return null;
}

export async function fetchInstagramMediaList(opts: {
  accessToken: string;
  limit?: number;
}): Promise<InstagramMediaRow[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 10, 50));
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me/media`);
  url.searchParams.set("fields", "id,permalink,media_type,timestamp");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", opts.accessToken);
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; code?: number } };
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    throw new Error(`Failed to fetch Instagram media list${detail}`);
  }
  const json = (await res.json()) as GraphMediaListResponse;
  return (json.data ?? [])
    .filter(
      (row): row is { id: string; permalink?: string; media_type?: string; timestamp?: string } =>
        typeof row.id === "string"
    )
    .map((row) => ({
      id: row.id,
      permalink: row.permalink,
      mediaType: typeof row.media_type === "string" ? row.media_type : undefined,
      timestamp: typeof row.timestamp === "string" ? row.timestamp : undefined
    }));
}

export async function fetchInstagramMediaViewsTotal(opts: {
  accessToken: string;
  pageLimit?: number;
  perPageLimit?: number;
}): Promise<number> {
  const pageLimit = Math.max(1, Math.min(opts.pageLimit ?? 10, 25));
  const perPageLimit = Math.max(1, Math.min(opts.perPageLimit ?? 50, 50));
  let nextUrl: string | null = null;
  let page = 0;
  let totalViews = 0;

  while (page < pageLimit) {
    const url = nextUrl
      ? new URL(nextUrl)
      : new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me/media?fields=id,media_type&limit=${perPageLimit}`);
    if (!nextUrl) {
      url.searchParams.set("access_token", opts.accessToken);
    }
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      break;
    }
    const json = (await res.json()) as GraphMediaListResponse;
    const media = (json.data ?? []).filter((row): row is { id: string; media_type?: string } => typeof row.id === "string");

    for (const row of media) {
      const metrics = metricsForMediaType(typeof row.media_type === "string" ? row.media_type : undefined);
      if (!metrics.includes("views")) continue;
      const metricCandidates = ["views", "plays", "video_views"];
      let pickedValue: number | null = null;
      for (const metric of metricCandidates) {
        const insightsRows = await fetchInstagramMediaInsights({
          accessToken: opts.accessToken,
          mediaId: row.id,
          metrics: [metric]
        }).catch(() => []);
        const candidateValue = insightsRows.find((insight) => insight.name === metric)?.values?.[0]?.value;
        if (typeof candidateValue === "number" && Number.isFinite(candidateValue)) {
          pickedValue = Math.max(0, Math.floor(candidateValue));
          break;
        }
      }
      if (pickedValue !== null) {
        totalViews += pickedValue;
      }
    }

    nextUrl = json.paging?.next ?? null;
    if (!nextUrl) break;
    page += 1;
  }

  return totalViews;
}

export async function fetchInstagramMediaInsights(opts: {
  accessToken: string;
  mediaId: string;
  metrics: string[];
}): Promise<InstagramInsightsRow[]> {
  const metricList = opts.metrics.filter(Boolean);
  if (metricList.length === 0) return [];
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/${opts.mediaId}/insights`);
  url.searchParams.set("metric", metricList.join(","));
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", opts.accessToken);
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; code?: number } };
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    throw new Error(`Failed to fetch Instagram media insights${detail}`);
  }
  const json = (await res.json()) as { data?: InstagramInsightsRow[] };
  return json.data ?? [];
}

export function metricsForMediaType(mediaType: string | undefined): string[] {
  const type = (mediaType ?? "").toUpperCase();
  if (type === "REELS" || type === "VIDEO") {
    return ["views", "reach", "likes", "comments", "saved", "shares"];
  }
  if (type === "STORY") {
    return ["views", "reach", "replies", "shares"];
  }
  return ["reach", "likes", "comments", "saved", "shares"];
}

function classifyInsightsError(message: string): {
  classification: InstagramInsightsFetchResult["classification"];
  status: InsightsDisplayStatus;
} {
  const lower = message.toLowerCase();
  if (lower.includes("code=190") || lower.includes("token")) {
    return { classification: "TOKEN_INVALID", status: "ERROR" };
  }
  if (lower.includes("code=10") || lower.includes("code=200") || lower.includes("permission")) {
    return { classification: "TOKEN_SCOPE_GAP", status: "ERROR" };
  }
  if (lower.includes("unknown error") || lower.includes("metric")) {
    return { classification: "UNSUPPORTED_FOR_MEDIA_TYPE", status: "PARTIAL" };
  }
  return { classification: "API_ERROR", status: "ERROR" };
}

export async function fetchMediaInsightsWithPolicy(opts: {
  accessToken: string;
  mediaId: string;
  mediaType?: string;
}): Promise<InstagramInsightsFetchResult> {
  const requestedMetrics = metricsForMediaType(opts.mediaType);
  try {
    const rows = await fetchInstagramMediaInsights({
      accessToken: opts.accessToken,
      mediaId: opts.mediaId,
      metrics: requestedMetrics
    });
    const returnedMetrics = rows.map((r) => r.name).filter((v): v is string => Boolean(v));
    const unsupportedMetrics = requestedMetrics.filter((m) => !returnedMetrics.includes(m));
    if (rows.length === 0) {
      return {
        requestedMetrics,
        returnedMetrics,
        unsupportedMetrics,
        classification: "NO_DATA_YET",
        status: "NO_DATA",
        rows
      };
    }
    return {
      requestedMetrics,
      returnedMetrics,
      unsupportedMetrics,
      classification: unsupportedMetrics.length > 0 ? "UNSUPPORTED_FOR_MEDIA_TYPE" : "OK",
      status: unsupportedMetrics.length > 0 ? "PARTIAL" : "COMPLETE",
      rows
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "insights_fetch_failed";
    const classified = classifyInsightsError(message);
    return {
      requestedMetrics,
      returnedMetrics: [],
      unsupportedMetrics: requestedMetrics,
      classification: classified.classification,
      status: classified.status,
      rows: [],
      errorMessage: message
    };
  }
}
// -----------------------------------------------------------------------------
// Audience Demographics (top cities)
// -----------------------------------------------------------------------------
export type InstagramDemographicEntry = {
  city: string;
  count: number;
};

export async function fetchInstagramAudienceDemographics(opts: {
  accessToken: string;
  instagramUserId: string;
}): Promise<InstagramDemographicEntry[]> {
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/${opts.instagramUserId}/insights`);
  url.searchParams.set("metric", "follower_demographics");
  url.searchParams.set("breakdown", "city");
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", opts.accessToken);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { error?: { message?: string; code?: number } };
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    throw new Error(`Failed to fetch Instagram audience demographics${detail}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      name?: string;
      period?: string;
      total_value?: {
        breakdowns?: Array<{
          dimension_keys?: string[];
          results?: Array<{
            dimension_values?: string[];
            value?: number;
          }>;
        }>;
      };
    }>;
  };

  const data = json.data?.[0];
  if (data?.name === "follower_demographics" && data.total_value?.breakdowns) {
    const breakdown = data.total_value.breakdowns.find(
      (b) => Array.isArray(b.dimension_keys) && b.dimension_keys.includes("city")
    );
    if (breakdown && Array.isArray(breakdown.results)) {
      const entries: InstagramDemographicEntry[] = breakdown.results
        .map((r) => {
          const cityName = Array.isArray(r.dimension_values) ? r.dimension_values[0] : "";
          return {
            city: typeof cityName === "string" ? cityName : "",
            count: typeof r.value === "number" ? r.value : 0
          };
        })
        .filter((e) => e.city !== "");

      // Sort descending by count
      return entries.sort((a, b) => b.count - a.count);
    }
  }

  return [];
}

export { decryptTokenFromStorage, encryptTokenForStorage } from "@/lib/token-crypto";


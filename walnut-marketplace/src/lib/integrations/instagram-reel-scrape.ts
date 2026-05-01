/**
 * HTTP-only fetch of Instagram reel pages; extracts view counts from embedded JSON in HTML.
 * Fragile by nature — Instagram markup changes often. No headless browser (Vercel-friendly).
 */

const IG_FETCH_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none"
};

const VIEW_KEYS = [
  "play_count",
  "video_view_count",
  "video_play_count",
  "ig_play_count",
  "total_interactions"
] as const;

export function normalizeInstagramReelUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "instagram.com" && host !== "m.instagram.com") {
    return null;
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (!/^\/(reel|p|reels)\/[^/]+/.test(path)) {
    return null;
  }
  url.hash = "";
  url.search = "";
  return `https://www.instagram.com${path}/`;
}

/** Exported for tests and fixture-based parsing without network I/O. */
export function extractViewCountFromHtml(html: string): { views: number; hint?: string } | null {
  const fromRegex = extractViewsViaRegex(html);
  if (fromRegex !== null) return fromRegex;

  const scriptJson = extractJsonBlocksFromScripts(html);
  for (const block of scriptJson) {
    const parsed = tryParseJson(block);
    if (!parsed) continue;
    const views = collectViewCandidates(parsed);
    if (views.length > 0) {
      return { views: Math.max(...views), hint: "embedded_json" };
    }
  }

  const ld = extractLdJsonVideoInteraction(html);
  if (ld !== null) return ld;

  return null;
}

function extractViewsViaRegex(html: string): { views: number; hint?: string } | null {
  const candidates: number[] = [];
  for (const key of VIEW_KEYS) {
    const re = new RegExp(`"${key}"\\s*:\\s*(\\d+)`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 0) candidates.push(n);
    }
  }
  if (candidates.length === 0) return null;
  return { views: Math.max(...candidates), hint: "regex_keys" };
}

function extractJsonBlocksFromScripts(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1]?.trim();
    if (body && body.length > 2) out.push(body);
  }
  return out;
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function collectViewCandidates(node: unknown, acc: number[] = []): number[] {
  if (node === null || node === undefined) return acc;
  if (typeof node === "object" && !Array.isArray(node)) {
    const o = node as Record<string, unknown>;
    for (const key of VIEW_KEYS) {
      const v = o[key];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        acc.push(Math.floor(v));
      }
    }
    for (const child of Object.values(o)) {
      collectViewCandidates(child, acc);
    }
  } else if (Array.isArray(node)) {
    for (const item of node) collectViewCandidates(item, acc);
  }
  return acc;
}

function extractLdJsonVideoInteraction(html: string): { views: number; hint?: string } | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const parsed = tryParseJson(m[1].trim());
    if (!parsed) continue;
    const views = readVideoObjectInteractionCount(parsed);
    if (views !== null) return { views, hint: "ld_json" };
  }
  return null;
}

function readVideoObjectInteractionCount(node: unknown): number | null {
  if (node === null || node === undefined) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const v = readVideoObjectInteractionCount(item);
      if (v !== null) return v;
    }
    return null;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (o["@type"] === "VideoObject" && typeof o.interactionStatistic === "object" && o.interactionStatistic) {
      const stat = o.interactionStatistic as Record<string, unknown>;
      const count = stat.userInteractionCount;
      if (typeof count === "number" && count >= 0) return Math.floor(count);
    }
    for (const v of Object.values(o)) {
      const inner = readVideoObjectInteractionCount(v);
      if (inner !== null) return inner;
    }
  }
  return null;
}

export type ScrapeReelViewsResult = {
  ok: boolean;
  status:
    | "OK"
    | "INVALID_URL"
    | "HTTP_ERROR"
    | "NETWORK_TIMEOUT"
    | "NETWORK_ERROR"
    | "LOGIN_WALL"
    | "CHALLENGE_PAGE"
    | "PARSE_MISS";
  views: number | null;
  canonicalUrl: string;
  raw: { extractionHint?: string; htmlLength?: number; httpStatus?: number; reason?: string };
};

function detectInstagramGate(html: string): "LOGIN_WALL" | "CHALLENGE_PAGE" | null {
  const lower = html.toLowerCase();
  if (
    lower.includes("challenge_required") ||
    lower.includes("/challenge/") ||
    lower.includes("please wait a few minutes before you try again")
  ) {
    return "CHALLENGE_PAGE";
  }
  if (
    lower.includes("log in") ||
    lower.includes("login") ||
    lower.includes("sign up") ||
    lower.includes("instagram")
  ) {
    // Instagram text alone is noisy; require auth-related hints.
    if (lower.includes("log in") || lower.includes("sign up")) {
      return "LOGIN_WALL";
    }
  }
  return null;
}

export async function scrapeReelViews(inputUrl: string): Promise<ScrapeReelViewsResult> {
  const canonicalUrl = normalizeInstagramReelUrl(inputUrl);
  if (!canonicalUrl) {
    return {
      ok: false,
      status: "INVALID_URL",
      views: null,
      canonicalUrl: inputUrl,
      raw: { reason: "normalize_failed" }
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const res = await fetch(canonicalUrl, {
      method: "GET",
      headers: IG_FETCH_HEADERS,
      cache: "no-store",
      signal: controller.signal,
      redirect: "follow"
    });
    if (!res.ok) {
      return {
        ok: false,
        status: "HTTP_ERROR",
        views: null,
        canonicalUrl,
        raw: { httpStatus: res.status, reason: "non_2xx_response" }
      };
    }
    const html = await res.text();
    const gate = detectInstagramGate(html);
    if (gate) {
      return {
        ok: false,
        status: gate,
        views: null,
        canonicalUrl,
        raw: { htmlLength: html.length, reason: gate.toLowerCase() }
      };
    }
    const extracted = extractViewCountFromHtml(html);
    if (!extracted) {
      return {
        ok: false,
        status: "PARSE_MISS",
        views: null,
        canonicalUrl,
        raw: { htmlLength: html.length, reason: "extract_view_count_null" }
      };
    }
    return {
      ok: true,
      status: "OK",
      views: extracted.views,
      canonicalUrl,
      raw: { extractionHint: extracted.hint, htmlLength: html.length }
    };
  } catch (error) {
    const aborted =
      (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");
    return {
      ok: false,
      status: aborted ? "NETWORK_TIMEOUT" : "NETWORK_ERROR",
      views: null,
      canonicalUrl,
      raw: { reason: aborted ? "abort_timeout" : "fetch_exception" }
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Public Instagram profile signals (web HTML / embedded JSON).
 * Datacenter IPs are often blocked; pair with Graph API when OAuth token is available.
 */

import {
  fetchInstagramGraphMeFields,
  type InstagramGraphMeFields
} from "@/lib/integrations/instagram";

export type InstagramPublicProfile = {
  fullName?: string;
  followersCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
};

const IG_WEB_APP_ID = "936619743392459";

/** Desktop Chrome — closer to what instagram.com expects than a bare fetch. */
const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "X-IG-App-ID": IG_WEB_APP_ID,
  "X-ASBD-ID": "129477",
  Referer: "https://www.instagram.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"'
};

const DOCUMENT_HEADERS: HeadersInit = {
  ...BROWSER_HEADERS,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
};

function sanitizeUsername(raw: string): string {
  const u = raw.replace(/^@/, "").trim().toLowerCase();
  if (!/^[a-z0-9._]+$/.test(u) || u.length > 30) {
    throw new Error("Invalid Instagram username");
  }
  return u;
}

function parseNumberFromHtml(html: string, patterns: RegExp[]): number | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const n = Number.parseInt(m[1].replace(/,/g, ""), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function parseStringFromHtml(html: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const s = m[1].replace(/\\u0026/g, "&").replace(/\\n/g, " ").trim();
      if (s) return s;
    }
  }
  return undefined;
}

function parseFromHtml(html: string): InstagramPublicProfile {
  const followersCount = parseNumberFromHtml(html, [
    /"edge_followed_by":\s*\{\s*"count":\s*(\d+)/,
    /"edge_followed_by":\{"count":(\d+)\}/,
    /followed_by_count":\s*(\d+)/,
    /"follower_count":\s*(\d+)/,
    /"followers":\s*\{\s*"count":\s*(\d+)/
  ]);
  const mediaCount = parseNumberFromHtml(html, [
    /"edge_owner_to_timeline_media":\s*\{\s*"count":\s*(\d+)/,
    /"edge_owner_to_timeline_media":\{"count":(\d+)/,
    /"media_count":\s*(\d+)/,
    /"edge_media_to_caption":\s*\{\s*"count":\s*(\d+)/
  ]);
  const fullName = parseStringFromHtml(html, [
    /"full_name":"((?:[^"\\]|\\.)*)"/,
    /"fullName":"((?:[^"\\]|\\.)*)"/
  ]);
  let profilePictureUrl = parseStringFromHtml(html, [
    /"profile_pic_url_hd":"((?:[^"\\]|\\.)*)"/,
    /"profile_pic_url":"((?:[^"\\]|\\.)*)"/
  ]);
  if (!profilePictureUrl) {
    const og = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (og?.[1]) profilePictureUrl = og[1];
  }
  return {
    fullName: fullName || undefined,
    followersCount,
    mediaCount,
    profilePictureUrl: profilePictureUrl || undefined
  };
}

/** Instagram often embeds profile state in Next.js payload. */
function parseNextData(html: string): InstagramPublicProfile {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m?.[1]) return {};
  try {
    const blob = m[1];
    return parseFromHtml(blob);
  } catch {
    return {};
  }
}

async function fetchWebProfileInfoJson(username: string): Promise<InstagramPublicProfile | null> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { headers: BROWSER_HEADERS, cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: {
      user?: {
        full_name?: string;
        edge_followed_by?: { count?: number };
        edge_owner_to_timeline_media?: { count?: number };
        profile_pic_url_hd?: string;
        profile_pic_url?: string;
      };
    };
    status?: string;
  };
  if (json.status === "fail") return null;
  const u = json.data?.user;
  if (!u) return null;
  return {
    fullName: u.full_name?.trim() || undefined,
    followersCount: u.edge_followed_by?.count,
    mediaCount: u.edge_owner_to_timeline_media?.count,
    profilePictureUrl: u.profile_pic_url_hd || u.profile_pic_url
  };
}

async function fetchProfileHtml(username: string): Promise<string> {
  const url = `https://www.instagram.com/${encodeURIComponent(username)}/`;
  const res = await fetch(url, {
    headers: DOCUMENT_HEADERS,
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Instagram returned HTTP ${res.status}`);
  }
  return res.text();
}

/** Prefer `a` when a field is set; otherwise use `b`. */
function mergePreferFirst(
  a: InstagramPublicProfile,
  b: InstagramPublicProfile
): InstagramPublicProfile {
  return {
    fullName: a.fullName ?? b.fullName,
    followersCount: a.followersCount ?? b.followersCount,
    mediaCount: a.mediaCount ?? b.mediaCount,
    profilePictureUrl: a.profilePictureUrl ?? b.profilePictureUrl
  };
}

export function graphMeFieldsToPublic(g: InstagramGraphMeFields): InstagramPublicProfile {
  return {
    fullName: g.profileName,
    followersCount: g.followersCount,
    mediaCount: g.mediaCount,
    profilePictureUrl: g.profilePictureUrl
  };
}

function hasAnyData(p: InstagramPublicProfile): boolean {
  return (
    p.fullName !== undefined ||
    p.followersCount !== undefined ||
    p.mediaCount !== undefined ||
    p.profilePictureUrl !== undefined
  );
}

/**
 * Collects everything we can from public web endpoints (no OAuth). Does not throw.
 */
export async function fetchInstagramPublicProfileBestEffort(rawUsername: string): Promise<InstagramPublicProfile> {
  let username: string;
  try {
    username = sanitizeUsername(rawUsername);
  } catch {
    return {};
  }

  let merged: InstagramPublicProfile = {};

  const fromApi = await fetchWebProfileInfoJson(username).catch(() => null);
  if (fromApi) merged = mergePreferFirst(merged, fromApi);

  let html: string | null = null;
  try {
    html = await fetchProfileHtml(username);
  } catch {
    html = null;
  }
  if (html) {
    const fromNext = parseNextData(html);
    const fromRegex = parseFromHtml(html);
    merged = mergePreferFirst(merged, mergePreferFirst(fromNext, fromRegex));
  }

  return merged;
}

/**
 * @throws if nothing could be read (Graph + web both empty).
 */
export async function fetchInstagramPublicProfile(rawUsername: string): Promise<InstagramPublicProfile> {
  const merged = await fetchInstagramPublicProfileBestEffort(rawUsername);
  if (!hasAnyData(merged)) {
    throw new Error(
      "Could not read this profile from Instagram. The account may be private, restricted, or blocked for automated requests."
    );
  }
  return merged;
}

/**
 * **Preferred path for “Update from Instagram”:** uses the official Graph API when a token exists
 * (works on Vercel for connected Professional accounts), then fills gaps from public web scraping.
 */
export async function fetchInstagramProfileForSync(opts: {
  username: string;
  accessToken?: string | null;
}): Promise<InstagramPublicProfile> {
  let graphLayer: InstagramPublicProfile = {};
  if (opts.accessToken) {
    const g = await fetchInstagramGraphMeFields(opts.accessToken);
    graphLayer = graphMeFieldsToPublic(g);
  }

  const webLayer = await fetchInstagramPublicProfileBestEffort(opts.username);
  const merged = mergePreferFirst(graphLayer, webLayer);

  if (!hasAnyData(merged)) {
    throw new Error(
      "Could not sync this profile. If you use Instagram Login, try reconnecting Instagram. Public web data can be blocked from some servers."
    );
  }
  return merged;
}

/**
 * Reads public Instagram profile data via the same web surfaces the browser uses.
 * Instagram may change HTML/JSON shape or block datacenter IPs; callers should handle failures.
 */

export type InstagramPublicProfile = {
  fullName?: string;
  followersCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
};

const IG_WEB_APP_ID = "936619743392459";

const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "X-IG-App-ID": IG_WEB_APP_ID,
  "X-ASBD-ID": "129477"
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
    /"follower_count":\s*(\d+)/
  ]);
  const mediaCount = parseNumberFromHtml(html, [
    /"edge_owner_to_timeline_media":\s*\{\s*"count":\s*(\d+)/,
    /"edge_owner_to_timeline_media":\{"count":(\d+)/,
    /"media_count":\s*(\d+)/
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
  };
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
    headers: {
      ...BROWSER_HEADERS,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
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

export async function fetchInstagramPublicProfile(rawUsername: string): Promise<InstagramPublicProfile> {
  const username = sanitizeUsername(rawUsername);

  const fromJson = (await fetchWebProfileInfoJson(username).catch(() => null)) ?? {};
  const html = await fetchProfileHtml(username).catch((e) => {
    throw e instanceof Error ? e : new Error("Could not load Instagram profile page");
  });
  const fromHtml = parseFromHtml(html);
  const merged = mergePreferFirst(fromJson, fromHtml);

  const hasAny =
    merged.fullName !== undefined ||
    merged.followersCount !== undefined ||
    merged.mediaCount !== undefined ||
    merged.profilePictureUrl !== undefined;

  if (!hasAny) {
    throw new Error(
      "Could not read this profile from Instagram. The account may be private, restricted, or blocked for automated requests."
    );
  }

  return merged;
}

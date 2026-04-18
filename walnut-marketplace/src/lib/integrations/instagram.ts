export type InstagramIdentity = {
  userId: string;
  username: string;
  accountType: "CREATOR" | "BUSINESS";
  accessToken: string;
};

type StatePayload = {
  mode: "login" | "signup" | "connect";
  email?: string;
  nonce: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
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

export function buildInstagramAuthorizeUrl(state: string): string {
  const clientId = getRequiredEnv("INSTAGRAM_CLIENT_ID");
  const redirectUri = getRequiredEnv("INSTAGRAM_REDIRECT_URI");
  const scope = process.env.INSTAGRAM_SCOPE ?? "instagram_business_basic";
  const url = new URL("https://api.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  return url.toString();
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

export async function exchangeCodeForAccessToken(code: string) {
  const clientId = getRequiredEnv("INSTAGRAM_CLIENT_ID");
  const clientSecret = getRequiredEnv("INSTAGRAM_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("INSTAGRAM_REDIRECT_URI");
  const tokenUrl = "https://api.instagram.com/oauth/access_token";
  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);
  body.set("code", code);

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Instagram code");
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Instagram access token missing");
  }
  return tokenJson.access_token;
}

export async function fetchInstagramIdentity(accessToken: string): Promise<InstagramIdentity> {
  const meUrl = new URL("https://graph.instagram.com/v25.0/me");
  // IG User fields: id, username, account_type (see IG User reference). Avoid optional fields that can 400 on some apps.
  meUrl.searchParams.set("fields", "id,username,account_type");
  meUrl.searchParams.set("access_token", accessToken);
  const meRes = await fetch(meUrl, { method: "GET" });
  if (!meRes.ok) {
    let detail = "";
    try {
      const errBody = (await meRes.json()) as { error?: { message?: string; code?: number } };
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    console.error(`Instagram /me HTTP ${meRes.status}${detail}`);
    throw new Error("Failed to fetch Instagram profile");
  }
  type MeRow = {
    id?: string;
    user_id?: string;
    username?: string;
    account_type?: string;
  };
  const raw = (await meRes.json()) as unknown;
  const flat = parseInstagramMeRow(raw);
  const row = flat as MeRow | undefined;
  const normalizedType = row?.account_type?.toUpperCase().replace(/\s+/g, "_");
  const accountType =
    normalizedType === "MEDIA_CREATOR" || normalizedType === "CREATOR"
      ? "CREATOR"
      : normalizedType === "BUSINESS"
        ? "BUSINESS"
        : undefined;
  const userId = row?.user_id ?? row?.id;
  const username = row?.username;

  if (!userId || !username || !accountType) {
    throw new Error("Instagram Professional account required");
  }
  return {
    userId,
    username,
    accountType,
    accessToken
  };
}

export { decryptTokenFromStorage, encryptTokenForStorage } from "@/lib/token-crypto";

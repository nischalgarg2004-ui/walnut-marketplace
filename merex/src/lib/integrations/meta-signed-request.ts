import crypto from "crypto";

/**
 * Meta sends a `signed_request` form parameter to the Deauthorize Callback URL
 * and the Data Deletion Request URL. The value is `<sig>.<payload>` where:
 *   - `<sig>` is base64url(HMAC-SHA256(secret, "<payload>"))
 *   - `<payload>` is base64url(JSON object)
 *
 * Documented at:
 *   https://developers.facebook.com/docs/development/release/asset-portability/data-deletion
 *   https://developers.facebook.com/docs/facebook-login/guides/advanced/deauthorize
 *
 * The same signing scheme is used for Instagram Login deauthorization /
 * data-deletion callbacks on `graph.instagram.com` apps.
 */

export type MetaSignedRequestPayload = {
  algorithm?: string;
  issued_at?: number;
  user_id?: string;
  /** Some Instagram deletion payloads include this; treat it the same as user_id. */
  instagram_user_id?: string;
  expires?: number;
  [key: string]: unknown;
};

export type ParsedSignedRequest = {
  payload: MetaSignedRequestPayload;
  userId: string;
};

function base64UrlDecodeToBuffer(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function timingSafeEqualBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Parses and verifies a Meta `signed_request` string using the Instagram /
 * Meta app secret (`INSTAGRAM_CLIENT_SECRET`). Throws if the signature is
 * missing, malformed, has the wrong algorithm, or does not match.
 */
export function parseMetaSignedRequest(signedRequest: string, appSecret: string): ParsedSignedRequest {
  if (!signedRequest || typeof signedRequest !== "string" || !signedRequest.includes(".")) {
    throw new Error("Malformed signed_request");
  }
  const [sigRaw, payloadRaw] = signedRequest.split(".", 2);
  if (!sigRaw || !payloadRaw) {
    throw new Error("Malformed signed_request");
  }
  const expectedSig = crypto.createHmac("sha256", appSecret).update(payloadRaw).digest();
  const providedSig = base64UrlDecodeToBuffer(sigRaw);
  if (!timingSafeEqualBuffers(expectedSig, providedSig)) {
    throw new Error("Invalid signed_request signature");
  }
  let payload: MetaSignedRequestPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToBuffer(payloadRaw).toString("utf8")) as MetaSignedRequestPayload;
  } catch {
    throw new Error("Malformed signed_request payload");
  }
  if (payload.algorithm && payload.algorithm.toUpperCase() !== "HMAC-SHA256") {
    throw new Error(`Unsupported signed_request algorithm: ${payload.algorithm}`);
  }
  const userId =
    (typeof payload.user_id === "string" && payload.user_id) ||
    (typeof payload.instagram_user_id === "string" && payload.instagram_user_id) ||
    "";
  if (!userId) {
    throw new Error("signed_request missing user_id");
  }
  return { payload, userId };
}

/**
 * Convenience: reads `signed_request` from a parsed form body and returns the
 * verified payload, throwing on any failure.
 */
export function parseSignedRequestFromForm(form: FormData, appSecret: string): ParsedSignedRequest {
  const raw = form.get("signed_request");
  if (typeof raw !== "string") {
    throw new Error("signed_request form field missing");
  }
  return parseMetaSignedRequest(raw, appSecret);
}

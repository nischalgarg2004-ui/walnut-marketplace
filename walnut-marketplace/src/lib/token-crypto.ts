import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc.v1.";

function deriveKey(): Buffer {
  const explicit = process.env.TOKEN_ENCRYPTION_KEY;
  if (explicit && explicit.length >= 32) {
    if (/^[0-9a-fA-F]{64}$/.test(explicit)) {
      return Buffer.from(explicit, "hex");
    }
    return createHash("sha256").update(explicit, "utf8").digest();
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET or TOKEN_ENCRYPTION_KEY for token encryption");
  }
  return createHash("sha256").update(`walnut:ig-token:${secret}`, "utf8").digest();
}

export function encryptTokenForStorage(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, enc]);
  return `${PREFIX}${blob.toString("base64url")}`;
}

function tryDecodeLegacyBase64(s: string): string | null {
  try {
    const buf = Buffer.from(s, "base64");
    const txt = buf.toString("utf8");
    if (txt.length > 0 && /^[\x20-\x7E]+$/.test(txt)) {
      return txt;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function decryptTokenFromStorage(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) {
    return tryDecodeLegacyBase64(stored) ?? stored;
  }
  const raw = stored.slice(PREFIX.length);
  const buf = Buffer.from(raw, "base64url");
  if (buf.length < 12 + 16) return null;
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

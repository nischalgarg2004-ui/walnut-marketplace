import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const LINK_VERIFY_TTL_MS = 10 * 60 * 1000;

function getSecret() {
  return process.env.SESSION_SECRET ?? "dev-only-insecure-secret";
}

export function generateSixDigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(input: { userId: string; email: string; otp: string; nonce: string }): string {
  const raw = `${input.userId}:${input.email}:${input.otp}:${input.nonce}`;
  return crypto.createHmac("sha256", getSecret()).update(raw).digest("hex");
}

export function isOtpFresh(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() <= OTP_TTL_MS;
}

export function getOtpTtlMinutes() {
  return OTP_TTL_MS / 60000;
}

export function createLinkVerificationToken(userId: string): string {
  const exp = Date.now() + LINK_VERIFY_TTL_MS;
  const payload = `${userId}:${exp}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

export function verifyLinkVerificationToken(token: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (expected !== sig) return false;
  const [payloadUserId, expRaw] = payload.split(":");
  const exp = Number(expRaw);
  if (!payloadUserId || !Number.isFinite(exp)) return false;
  if (payloadUserId !== userId) return false;
  return Date.now() <= exp;
}

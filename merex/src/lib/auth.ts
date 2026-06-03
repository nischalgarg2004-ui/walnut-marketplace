import { UserRole } from "@prisma/client";
import crypto from "crypto";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME as SESSION_COOKIE } from "@/lib/brand";

/** Use Secure cookies in production except on localhost/loopback (HTTP cannot set Secure cookies). */
export function sessionCookieSecure(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }
  const forwarded = req.headers.get("x-forwarded-host")?.split(":")[0];
  const host = forwarded && forwarded.length > 0 ? forwarded : req.nextUrl.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return false;
  }
  return true;
}

export type SessionUser = {
  userId: string;
  role: UserRole;
  email: string;
};

const ROLE_SET = new Set(["CREATOR", "BUSINESS", "ADMIN"]);

const COOKIE_NAME = SESSION_COOKIE;

type SessionPayload = {
  userId: string;
  role: UserRole;
  email: string;
  exp: number;
};

function getSecret() {
  return process.env.SESSION_SECRET ?? "dev-only-insecure-secret";
}

function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string) {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(user: { userId: string; role: UserRole; email: string }) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadEncoded, signature] = parts;
  const expected = sign(payloadEncoded);
  if (signature !== expected) return null;
  const parsed = JSON.parse(fromBase64Url(payloadEncoded)) as SessionPayload;
  if (!ROLE_SET.has(parsed.role)) return null;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return {
    userId: parsed.userId,
    role: parsed.role,
    email: parsed.email
  };
}

export function getSessionUser(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const cookieUser = parseSessionToken(token);
    if (cookieUser) return cookieUser;
  }
  // Backward compatible fallback for older internal calls.
  const userId = req.headers.get("x-user-id");
  const roleRaw = req.headers.get("x-role");
  const email = req.headers.get("x-email");
  if (!userId || !roleRaw || !email) return null;
  const roleUpper = roleRaw.toUpperCase();
  if (!ROLE_SET.has(roleUpper)) return null;
  const role = roleUpper as UserRole;
  return { userId, role, email };
}

export function getRequiredSessionUser(req: NextRequest): SessionUser {
  const user = getSessionUser(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function requireRole(user: SessionUser, allowed: UserRole[]) {
  if (!allowed.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
}

export { SESSION_COOKIE as SESSION_COOKIE_NAME };

import { compare } from "bcryptjs";

import { UserRole } from "@prisma/client";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";

import { getConfiguredAdminHostname, isAdminHostname, normalizeHostname } from "@/lib/admin-host";

import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  next: z.string().optional()
});

function postLoginRedirectPath(role: UserRole, nextParam: string | undefined): string {
  const next = nextParam?.trim();

  if (next && (next.startsWith("/creator") || next.startsWith("/business") || next.startsWith("/admin"))) {
    if (role === UserRole.CREATOR && next.startsWith("/creator")) return next;
    if (role === UserRole.BUSINESS && next.startsWith("/business")) return next;
    if (role === UserRole.ADMIN && next.startsWith("/admin")) return next;
  }

  switch (role) {
    case UserRole.CREATOR:
      return "/creator";
    case UserRole.BUSINESS:
      return "/business/home";
    default:
      return "/admin";
  }
}

function requestHostname(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host")?.split(":")[0];
  if (forwarded && forwarded.length > 0) return normalizeHostname(forwarded);
  return normalizeHostname(req.headers.get("host"));
}

export async function POST(req: NextRequest) {
  try {
    const payload = loginSchema.parse(await req.json());
    const host = requestHostname(req);
    const onAdminHost = isAdminHostname(host);
    const adminPortalConfigured = Boolean(getConfiguredAdminHostname());

    const user = await db.user.findUnique({ where: { email: payload.email } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await compare(payload.password, user.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This account is suspended. Contact support if you believe this is a mistake." },
        { status: 403 }
      );
    }

    if (onAdminHost && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (adminPortalConfigured && user.role === UserRole.ADMIN && !onAdminHost) {
      return NextResponse.json(
        {
          error:
            "Administrator sign-in is only available on the admin portal. Open the admin URL from your team runbook."
        },
        { status: 403 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });

    const path = postLoginRedirectPath(user.role, payload.next);

    const response = NextResponse.json({
      data: {
        role: user.role,
        redirect: path
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieSecure(req),
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

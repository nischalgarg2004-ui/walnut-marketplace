import fs from "fs";
import path from "path";
import { compare } from "bcryptjs";

import { UserRole } from "@prisma/client";

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";

import { db } from "@/lib/db";



const loginSchema = z.object({

  email: z.string().email(),

  password: z.string().min(6),

  next: z.string().optional()

});

function appendDebugFileLog(entry: Record<string, unknown>) {
  // #region agent log
  try {
    const line = `${JSON.stringify(entry)}\n`;
    const fileCwd = path.join(process.cwd(), "debug-d9df3a.log");
    const fileAbs = "d:\\debug-d9df3a.log";
    fs.appendFileSync(fileCwd, line, "utf8");
    fs.appendFileSync(fileAbs, line, "utf8");
  } catch {
    /* ignore */
  }
  // #endregion
}



function postLoginRedirectPath(role: UserRole, nextParam: string | undefined): string {

  const next = nextParam?.trim();

  if (

    next &&

    (next.startsWith("/creator") || next.startsWith("/business") || next.startsWith("/admin"))

  ) {

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



export async function POST(req: NextRequest) {

  try {

    const payload = loginSchema.parse(await req.json());
    appendDebugFileLog({
      sessionId: "d9df3a",
      location: "api/auth/login/route.ts:POST",
      message: "server_login_hit",
      data: { emailLen: payload.email.length, hasNext: Boolean(payload.next) },
      timestamp: Date.now(),
      hypothesisId: "H6-H9"
    });

    const user = await db.user.findUnique({ where: { email: payload.email } });

    if (!user?.passwordHash) {

      // #region agent log

      fetch("http://127.0.0.1:7692/ingest/0242ad20-c2e6-410e-ad89-a39ea499ef87", {

        method: "POST",

        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d9df3a" },

        body: JSON.stringify({

          sessionId: "d9df3a",

          location: "api/auth/login/route.ts:POST",

          message: "login_reject_no_password_hash",

          data: { hasUser: Boolean(user) },

          timestamp: Date.now(),

          hypothesisId: "H2"

        })

      }).catch(() => {});

      // #endregion

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    }



    const valid = await compare(payload.password, user.passwordHash);

    if (!valid) {

      // #region agent log

      fetch("http://127.0.0.1:7692/ingest/0242ad20-c2e6-410e-ad89-a39ea499ef87", {

        method: "POST",

        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d9df3a" },

        body: JSON.stringify({

          sessionId: "d9df3a",

          location: "api/auth/login/route.ts:POST",

          message: "login_reject_bad_password",

          data: {},

          timestamp: Date.now(),

          hypothesisId: "H2"

        })

      }).catch(() => {});

      // #endregion

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    }



    const token = createSessionToken({

      userId: user.id,

      role: user.role,

      email: user.email

    });



    const path = postLoginRedirectPath(user.role, payload.next);

    // JSON + Set-Cookie (not 303): fetch(..., redirect:"manual") often yields an opaque redirect
    // where the client cannot read Location/body, so response.json() fails with "Invalid response from server".
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

    // #region agent log

    fetch("http://127.0.0.1:7692/ingest/0242ad20-c2e6-410e-ad89-a39ea499ef87", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d9df3a" },
      body: JSON.stringify({
        sessionId: "d9df3a",
        location: "api/auth/login/route.ts:POST",
        message: "login_200_json_with_cookie",
        data: {
          role: user.role,
          secure: sessionCookieSecure(req),
          tokenLen: token.length,
          path,
          runId: "post-fix"
        },
        timestamp: Date.now(),
        hypothesisId: "H5-verify"
      })
    }).catch(() => {});

    // #endregion

    appendDebugFileLog({
      sessionId: "d9df3a",
      location: "api/auth/login/route.ts:POST",
      message: "server_login_json_return",
      data: { status: 200, path, role: user.role },
      timestamp: Date.now(),
      hypothesisId: "H7-H8"
    });
    return response;

  } catch (error) {

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 400 });

  }

}


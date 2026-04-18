import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const payload = signupSchema.parse(await req.json());
    const existing = await db.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hash(payload.password, 10);
    const user = await db.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: UserRole.CREATOR,
        creatorProfile: {
          create: {
            fullName: payload.fullName,
            niches: []
          }
        }
      }
    });

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const response = NextResponse.json({
      data: { userId: user.id, role: user.role, next: "/creator/connect-instagram" }
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

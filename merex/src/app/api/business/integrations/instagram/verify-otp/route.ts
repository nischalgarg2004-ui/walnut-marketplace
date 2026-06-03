import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSessionUser, sessionCookieSecure } from "@/lib/auth";
import { createLinkVerificationToken, hashOtp, isOtpFresh } from "@/lib/otp";

const OTP_KIND = "BUSINESS_INSTAGRAM_LINK_OTP";
const COOKIE_NAME = "business_link_verified";

const bodySchema = z.object({
  otp: z.string().regex(/^\d{6}$/)
});

export async function POST(req: NextRequest) {
  try {
    const session = getRequiredSessionUser(req);
    if (session.role !== UserRole.BUSINESS) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = bodySchema.parse(await req.json());

    const record = await db.consentRecord.findFirst({
      where: {
        userId: session.userId,
        kind: OTP_KIND
      },
      orderBy: { createdAt: "desc" }
    });

    if (!record || !record.payloadHash || !isOtpFresh(record.createdAt)) {
      return NextResponse.json({ error: "OTP expired. Request a new code." }, { status: 400 });
    }

    const [nonce, storedHash] = record.payloadHash.split(":");
    if (!nonce || !storedHash) {
      return NextResponse.json({ error: "Invalid OTP state." }, { status: 400 });
    }

    const computed = hashOtp({
      userId: session.userId,
      email: session.email,
      otp: body.otp,
      nonce
    });

    if (computed !== storedHash) {
      return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    await db.consentRecord.deleteMany({
      where: { userId: session.userId, kind: OTP_KIND }
    });

    const token = createLinkVerificationToken(session.userId);
    const response = NextResponse.json({ data: { verified: true } });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieSecure(req),
      path: "/",
      maxAge: 60 * 10
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

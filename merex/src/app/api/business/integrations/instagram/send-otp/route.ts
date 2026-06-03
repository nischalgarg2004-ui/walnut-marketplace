import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBusinessInstagramOtpEmail } from "@/lib/email";
import { getRequiredSessionUser } from "@/lib/auth";
import { generateSixDigitOtp, getOtpTtlMinutes, hashOtp } from "@/lib/otp";

const OTP_KIND = "BUSINESS_INSTAGRAM_LINK_OTP";

export async function POST(req: NextRequest) {
  try {
    const session = getRequiredSessionUser(req);
    if (session.role !== UserRole.BUSINESS) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nonce = crypto.randomUUID();
    const otp = generateSixDigitOtp();
    const otpHash = hashOtp({
      userId: session.userId,
      email: session.email,
      otp,
      nonce
    });

    await db.consentRecord.deleteMany({
      where: {
        userId: session.userId,
        kind: OTP_KIND
      }
    });

    await db.consentRecord.create({
      data: {
        userId: session.userId,
        kind: OTP_KIND,
        entityType: "BUSINESS_PROFILE",
        entityId: session.email,
        payloadHash: `${nonce}:${otpHash}`
      }
    });

    await sendBusinessInstagramOtpEmail({
      to: session.email,
      otp,
      minutes: getOtpTtlMinutes()
    });

    return NextResponse.json({ data: { sent: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

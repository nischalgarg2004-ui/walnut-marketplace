import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequiredSessionUser } from "@/lib/auth";
import { verifyLinkVerificationToken } from "@/lib/otp";

const COOKIE_NAME = "business_link_verified";

export async function GET(req: NextRequest) {
  try {
    const session = getRequiredSessionUser(req);
    if (session.role !== UserRole.BUSINESS) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await db.businessProfile.findUnique({
      where: { userId: session.userId },
      select: {
        instagramUserId: true,
        instagramUsername: true,
        instagramConnectedAt: true
      }
    });
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const otpVerified = token ? verifyLinkVerificationToken(token, session.userId) : false;

    return NextResponse.json({
      data: {
        otpVerified,
        linked: Boolean(profile?.instagramUserId),
        instagramUsername: profile?.instagramUsername ?? null,
        connectedAt: profile?.instagramConnectedAt ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch link status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

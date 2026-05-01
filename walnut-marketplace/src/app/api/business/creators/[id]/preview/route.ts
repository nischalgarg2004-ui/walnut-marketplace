import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(_req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id: creatorId } = await params;

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const gate = await db.application.findFirst({
      where: {
        creatorId,
        requirement: { businessId: business.id }
      },
      select: { id: true }
    });
    if (!gate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      select: {
        fullName: true,
        bio: true,
        niches: true,
        followerCount: true,
        postCount: true,
        avgEngagement: true,
        instagramHandle: true,
        instagramUsername: true,
        instagramProfilePictureUrl: true,
        city: true,
        state: true
      }
    });
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({ data: creator });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

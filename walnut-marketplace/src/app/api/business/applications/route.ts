import { ApplicationStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const creatorSelect = {
  id: true,
  fullName: true,
  followerCount: true,
  postCount: true,
  bio: true,
  niches: true,
  avgEngagement: true,
  instagramHandle: true,
  instagramUsername: true,
  instagramProfilePictureUrl: true,
  indiaStateId: true,
  indiaDistrictId: true
} as const;

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const requirementId = req.nextUrl.searchParams.get("requirementId");
    const statusParam = req.nextUrl.searchParams.get("status");

    const where: {
      requirement: { businessId: string };
      requirementId?: string;
      status?: ApplicationStatus;
    } = {
      requirement: { businessId: business.id }
    };
    if (requirementId) {
      where.requirementId = requirementId;
    }
    if (statusParam && ["APPLIED", "WAITLISTED", "APPROVED", "REJECTED"].includes(statusParam)) {
      where.status = statusParam as ApplicationStatus;
    }

    const applications = await db.application.findMany({
      where,
      include: {
        requirement: { select: { id: true, title: true } },
        creator: { select: creatorSelect }
      },
      orderBy: { appliedAt: "desc" }
    });

    return NextResponse.json({ data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

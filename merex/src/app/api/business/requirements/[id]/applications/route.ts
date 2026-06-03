import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id: requirementId } = await params;

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const requirement = await db.requirement.findFirst({
      where: { id: requirementId, businessId: business.id },
      include: {
        eligibility: true,
        compensation: true
      }
    });
    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    const applications = await db.application.findMany({
      where: { requirementId },
      include: {
        creator: { select: creatorSelect },
        contract: {
          include: {
            deliverables: { select: { id: true, status: true, slotIndex: true, expectedKind: true } },
            barterShipment: { select: { id: true, status: true } },
            performanceReport: { select: { viewsCount: true, status: true } },
            payouts: { select: { id: true, status: true } }
          }
        }
      },
      orderBy: { appliedAt: "desc" }
    });

    const auditEntries = await db.auditLog.findMany({
      where: {
        entityType: "Application",
        entityId: { in: applications.map((a) => a.id) }
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(applications.length * 6, 24)
    });
    const auditByApplication = new Map<string, typeof auditEntries>();
    for (const entry of auditEntries) {
      const existing = auditByApplication.get(entry.entityId) ?? [];
      if (existing.length < 6) {
        existing.push(entry);
      }
      auditByApplication.set(entry.entityId, existing);
    }

    const applicationsWithAudit = applications.map((app) => ({
      ...app,
      auditTrail: auditByApplication.get(app.id) ?? []
    }));

    return NextResponse.json({ data: { requirement, applications: applicationsWithAudit } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

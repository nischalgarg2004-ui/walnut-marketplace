import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
    if (!business && user.role === UserRole.BUSINESS) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }
    const businessId = user.role === UserRole.ADMIN ? undefined : business?.id;
    if (!businessId && user.role === UserRole.BUSINESS) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const where =
      user.role === UserRole.ADMIN
        ? {}
        : {
            businessId: businessId!
          };

    const contracts = await db.contract.findMany({
      where,
      include: {
        creator: {
          select: {
            fullName: true,
            instagramUsername: true,
            followerCount: true,
            instagramHandle: true
          }
        },
        requirement: { select: { title: true, id: true, deliveryDueAt: true, deliveryDueOffsetDays: true } },
        application: { select: { status: true, appliedAt: true } },
        deliverables: { orderBy: { submittedAt: "desc" } },
        barterShipment: true,
        performanceReport: true,
        metricSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
        payouts: { orderBy: { releasedAt: "desc" }, take: 1 }
      },
      orderBy: { acceptedAt: "desc" }
    });

    const rows = contracts.map((c) => ({
      contractId: c.id,
      requirementId: c.requirementId,
      requirementTitle: c.requirement.title,
      creatorName: c.creator.fullName,
      instagramUsername: c.creator.instagramUsername ?? c.creator.instagramHandle,
      followerCount: c.creator.followerCount,
      applicationStatus: c.application.status,
      contractStatus: c.status,
      acceptedAt: c.acceptedAt,
      deliveryEtaAt: c.deliveryEtaAt,
      barter: c.barterShipment
        ? {
            status: c.barterShipment.status,
            trackingHint: c.barterShipment.trackingHint,
            shippedAt: c.barterShipment.shippedAt,
            receivedAt: c.barterShipment.receivedAt
          }
        : null,
      latestDeliverable: c.deliverables[0]
        ? {
            id: c.deliverables[0].id,
            status: c.deliverables[0].status,
            contentSource: c.deliverables[0].contentSource,
            externalUrl: c.deliverables[0].externalUrl,
            submittedAt: c.deliverables[0].submittedAt
          }
        : null,
      viewsCount: c.performanceReport?.viewsCount ?? null,
      lastMetricSync: c.metricSnapshots[0]?.capturedAt ?? null,
      lastMetricViews: c.metricSnapshots[0]?.views ?? null,
      payoutStatus: c.payouts[0]?.status ?? null
    }));

    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

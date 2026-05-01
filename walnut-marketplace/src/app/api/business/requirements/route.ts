import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { buildCriteriaNarrative } from "@/lib/campaign-feed-narrative";
import { db } from "@/lib/db";

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

    const requirements = await db.requirement.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        eligibility: true,
        compensation: true,
        business: { select: { brandName: true } },
        _count: {
          select: {
            applications: true,
            reactions: true,
            comments: true,
            shareEvents: true
          }
        }
      }
    });

    const ids = requirements.map((r) => r.id);
    const approvedCounts =
      ids.length === 0
        ? []
        : await db.application.groupBy({
            by: ["requirementId"],
            where: {
              requirementId: { in: ids },
              status: "APPROVED"
            },
            _count: { _all: true }
          });
    const approvedByReq = new Map(approvedCounts.map((g) => [g.requirementId, g._count._all]));
    const contractRows =
      ids.length === 0
        ? []
        : await db.contract.findMany({
            where: { requirementId: { in: ids } },
            select: {
              requirementId: true,
              payouts: {
                where: { status: "PAID" },
                select: { netAmount: true }
              }
            }
          });
    const spentByReq = new Map<string, number>();
    for (const contract of contractRows) {
      const paidTotal = contract.payouts.reduce((sum, payout) => sum + Number(payout.netAmount ?? 0), 0);
      spentByReq.set(contract.requirementId, (spentByReq.get(contract.requirementId) ?? 0) + paidTotal);
    }

    const reactionRows = await db.requirementReaction.findMany({
      where: {
        requirementId: { in: ids },
        userId: user.userId
      },
      select: { requirementId: true, type: true }
    });
    const reactionByReq = new Map(reactionRows.map((r) => [r.requirementId, r.type]));

    const data = requirements.map((r) => ({
      ...r,
      category: r.category,
      clippingSummary:
        r.category === "CLIPPING"
          ? {
              sourceCount: Array.isArray((r.clippingMeta as { sourceItems?: unknown[] } | null)?.sourceItems)
                ? ((r.clippingMeta as { sourceItems?: unknown[] }).sourceItems?.length ?? 0)
                : 0
            }
          : null,
      _count: {
        ...r._count,
        applicationsApproved: approvedByReq.get(r.id) ?? 0
      },
      viewerReaction: reactionByReq.get(r.id) ?? null,
      spentAmount: spentByReq.get(r.id) ?? 0,
      authorHref: "/business/profile",
      criteriaNarrative: buildCriteriaNarrative({
        category: r.category,
        eligibility: r.eligibility,
        compensation: r.compensation,
        deliverableCount: r.deliverableCount,
        deliverableKind: r.deliverableKind,
        deliverableSlots: r.deliverableSlots,
        applicationDeadline: r.applicationDeadline,
        deliveryDueAt: r.deliveryDueAt,
        startDate: r.startDate,
        endDate: r.endDate,
        contentType: r.contentType
      })
    }));

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

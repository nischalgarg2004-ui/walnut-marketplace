import { NextRequest, NextResponse } from "next/server";
import { RequirementStatus } from "@prisma/client";
import { requireConnectedCreator } from "@/lib/creator-access";
import { buildCriteriaNarrative } from "@/lib/campaign-feed-narrative";
import { db } from "@/lib/db";
import { isEligible } from "@/lib/eligibility";
import {
  estimatedMonetaryValue,
  matchesDealType,
  type DealTypeFilter
} from "@/lib/compensation-deal-type";

function parseDealType(v: string | null): DealTypeFilter {
  if (!v || v === "all") return "all";
  if (v === "fixed" || v === "cpv" || v === "barter" || v === "hybrid") return v;
  return "all";
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireConnectedCreator(req);
    const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });
    }

    const sp = req.nextUrl.searchParams;
    const eligibleOnly = sp.get("eligibleOnly") !== "false";
    const dealType = parseDealType(sp.get("dealType"));
    const sort = sp.get("sort") ?? "newest";
    const category = sp.get("category");
    if (sort === "rating") {
      return NextResponse.json(
        { error: "Sort by rating is not available until ratings are implemented" },
        { status: 400 }
      );
    }
    const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(sp.get("pageSize") ?? "20") || 20));

    const requirements = await db.requirement.findMany({
      where: { status: RequirementStatus.PUBLISHED },
      include: {
        eligibility: true,
        compensation: true,
        business: { select: { brandName: true, id: true } },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shareEvents: true
          }
        }
      }
    });

    const requirementIds = requirements.map((r) => r.id);
    const viewerReactions = requirementIds.length
      ? await db.requirementReaction.findMany({
          where: {
            requirementId: { in: requirementIds },
            userId: user.userId
          },
          select: { requirementId: true, type: true }
        })
      : [];
    const reactionByReq = new Map(viewerReactions.map((r) => [r.requirementId, r.type]));
    const contractRows = requirementIds.length
      ? await db.contract.findMany({
          where: { requirementId: { in: requirementIds } },
          select: {
            requirementId: true,
            payouts: {
              where: { status: "PAID" },
              select: { netAmount: true }
            }
          }
        })
      : [];
    const spentByReq = new Map<string, number>();
    for (const contract of contractRows) {
      const paidTotal = contract.payouts.reduce((sum, payout) => sum + Number(payout.netAmount ?? 0), 0);
      spentByReq.set(contract.requirementId, (spentByReq.get(contract.requirementId) ?? 0) + paidTotal);
    }

    let rows = requirements.map((r) => ({
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
      personaFit:
        r.category !== "CLIPPING"
          ? true
          : creator.primaryPersona === "EDITOR_PAGE" || creator.clippingEnabled === true,
      viewerReaction: reactionByReq.get(r.id) ?? null,
      spentAmount: spentByReq.get(r.id) ?? 0,
      authorHref: `/creator/opportunity/${r.id}`,
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
      }),
      eligible:
        r.eligibility &&
        isEligible(
          {
            ...r.eligibility,
            allowedDistrictIds: r.eligibility.allowedDistrictIds ?? []
          },
          {
            gender: creator.gender,
            followerCount: creator.followerCount,
            avgEngagement: creator.avgEngagement,
            location: creator.city,
            niches: creator.niches,
            indiaDistrictId: creator.indiaDistrictId
          },
          { hasBarter: r.compensation?.hasBarter === true }
        )
    }));

    if (eligibleOnly) {
      rows = rows.filter((r) => r.eligible);
    }
    if (dealType !== "all") {
      rows = rows.filter((r) => matchesDealType(r.compensation, dealType));
    }

    if (category === "UGC" || category === "CLIPPING") {
      rows = rows.filter((r) => r.category === category);
    }

    if (sort === "value") {
      rows.sort(
        (a, b) =>
          estimatedMonetaryValue(b.compensation) - estimatedMonetaryValue(a.compensation)
      );
    } else {
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = rows.length;
    const slice = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    return NextResponse.json({
      data: slice,
      meta: { total, page, pageSize, eligibleOnly, dealType, sort, category: category ?? "ALL" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { RequirementStatus } from "@prisma/client";
import { requireConnectedCreator } from "@/lib/creator-access";
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
        business: { select: { brandName: true, id: true } }
      }
    });

    let rows = requirements.map((r) => ({
      ...r,
      eligible:
        r.eligibility &&
        isEligible(r.eligibility, {
          gender: creator.gender,
          followerCount: creator.followerCount,
          avgEngagement: creator.avgEngagement,
          location: creator.city,
          niches: creator.niches
        })
    }));

    if (eligibleOnly) {
      rows = rows.filter((r) => r.eligible);
    }
    if (dealType !== "all") {
      rows = rows.filter((r) => matchesDealType(r.compensation, dealType));
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
      meta: { total, page, pageSize, eligibleOnly, dealType, sort }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

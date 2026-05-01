import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type SourceTypePerf = {
  sourceType: string;
  campaigns: number;
  applications: number;
  verified: number;
};

function extractSourceTypes(clippingMeta: unknown): string[] {
  if (!clippingMeta || typeof clippingMeta !== "object") return [];
  const sourceItems = (clippingMeta as { sourceItems?: Array<{ type?: unknown }> }).sourceItems;
  if (!Array.isArray(sourceItems)) return [];
  return sourceItems
    .map((item) => (typeof item?.type === "string" ? item.type : null))
    .filter((v): v is string => Boolean(v));
}

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    const role = user.role;

    if (role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business) return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
      const totalRequirements = await db.requirement.count({ where: { businessId: business.id } });
      const totalApplications = await db.application.count({
        where: { requirement: { businessId: business.id } }
      });
      const clippingRequirements = await db.requirement.findMany({
        where: { businessId: business.id, category: "CLIPPING" },
        select: { id: true, clippingMeta: true }
      });
      const clippingRequirementIds = clippingRequirements.map((r) => r.id);
      const clippingApplications =
        clippingRequirementIds.length === 0
          ? []
          : await db.application.findMany({
              where: { requirementId: { in: clippingRequirementIds } },
              select: {
                id: true,
                requirementId: true,
                status: true,
                decisionReason: true,
                appliedAt: true,
                clippingLifecycleStatus: true,
                clippingSampleUrl: true,
                clippingFinalUrl: true
              }
            });

      const sampleSubmitted = clippingApplications.filter((a) => Boolean(a.clippingSampleUrl)).length;
      const approvedForPublish = clippingApplications.filter(
        (a) => a.clippingLifecycleStatus === "APPROVED_FOR_PUBLISH"
      ).length;
      const published = clippingApplications.filter((a) => Boolean(a.clippingFinalUrl)).length;
      const verified = clippingApplications.filter((a) => a.clippingLifecycleStatus === "VERIFIED").length;
      const paid = clippingApplications.filter((a) => a.clippingLifecycleStatus === "PAID").length;
      const rejected = clippingApplications.filter((a) => a.status === "REJECTED").length;

      const approvalRate =
        clippingApplications.length > 0
          ? Math.round((approvedForPublish / clippingApplications.length) * 100)
          : 0;
      const publishVerificationRate = published > 0 ? Math.round((verified / published) * 100) : 0;

      const durationsMs = clippingApplications
        .filter((a) => a.clippingSampleUrl)
        .map((a) => Date.now() - new Date(a.appliedAt).getTime())
        .filter((v) => Number.isFinite(v) && v > 0);
      const avgTimeToFirstSampleHours =
        durationsMs.length > 0
          ? Math.round(durationsMs.reduce((acc, v) => acc + v, 0) / durationsMs.length / (1000 * 60 * 60))
          : 0;

      const rejectionMix = clippingApplications
        .filter((a) => a.status === "REJECTED")
        .reduce(
          (acc, app) => {
            const reason = (app.decisionReason ?? "").toLowerCase();
            if (reason.includes("hook")) acc.hookQuality += 1;
            else if (reason.includes("brand") || reason.includes("safety") || reason.includes("compliance")) {
              acc.brandSafety += 1;
            } else if (reason.includes("cta") || reason.includes("instruction")) {
              acc.ctaCompliance += 1;
            } else {
              acc.other += 1;
            }
            return acc;
          },
          { hookQuality: 0, brandSafety: 0, ctaCompliance: 0, other: 0 }
        );

      const sourcePerfMap = new Map<string, SourceTypePerf>();
      for (const requirement of clippingRequirements) {
        const sourceTypes = extractSourceTypes(requirement.clippingMeta);
        const appRows = clippingApplications.filter((a) => a.requirementId === requirement.id);
        for (const sourceType of sourceTypes) {
          const existing = sourcePerfMap.get(sourceType) ?? {
            sourceType,
            campaigns: 0,
            applications: 0,
            verified: 0
          };
          existing.campaigns += 1;
          existing.applications += appRows.length;
          existing.verified += appRows.filter((a) => a.clippingLifecycleStatus === "VERIFIED").length;
          sourcePerfMap.set(sourceType, existing);
        }
      }

      return NextResponse.json({
        data: {
          totalRequirements,
          totalApplications,
          clipping: {
            campaignCount: clippingRequirements.length,
            applicationCount: clippingApplications.length,
            sampleSubmitted,
            approvedForPublish,
            published,
            verified,
            paid,
            rejected,
            approvalRate,
            publishVerificationRate,
            avgTimeToFirstSampleHours,
            rejectionMix,
            sourceTypePerformance: Array.from(sourcePerfMap.values()).sort(
              (a, b) => b.applications - a.applications
            )
          }
        }
      });
    }

    if (role === UserRole.CREATOR) {
      const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
      if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });
      const totalApplications = await db.application.count({ where: { creatorId: creator.id } });
      const approvedApplications = await db.application.count({
        where: { creatorId: creator.id, status: "APPROVED" }
      });
      return NextResponse.json({ data: { totalApplications, approvedApplications } });
    }

    requireRole(user, [UserRole.ADMIN]);
    const [users, requirements, payouts] = await Promise.all([
      db.user.count(),
      db.requirement.count(),
      db.payout.count()
    ]);
    return NextResponse.json({ data: { users, requirements, payouts } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireConnectedCreator } from "@/lib/creator-access";

export async function GET(req: NextRequest) {
  try {
    const { creatorProfileId } = await requireConnectedCreator(req);
    const contracts = await db.contract.findMany({
      where: { creatorId: creatorProfileId },
      include: {
        requirement: { include: { compensation: true, business: { select: { brandName: true } } } },
        deliverables: { include: { submissions: true } },
        performanceReport: true,
        payouts: { orderBy: { releasedAt: "desc" } }
      }
    });
    const payouts = await db.payout.findMany({
      where: { contract: { creatorId: creatorProfileId } },
      include: {
        contract: {
          select: {
            requirement: { select: { title: true } },
            business: { select: { brandName: true } }
          }
        }
      },
      orderBy: { releasedAt: "desc" }
    });
    const activeReceivables = contracts
      .filter((contract) => {
        const hasPaid = contract.payouts.some((p) => p.status === "PAID" || p.status === "PROCESSING");
        if (hasPaid) return false;
        const isClipping = contract.requirement.category === "CLIPPING";
        const ready = contract.deliverables.every((d) => {
          const draftApproved = d.submissions.some((s) => s.stage === "DRAFT" && s.status === "APPROVED");
          const publishApproved = d.submissions.some(
            (s) => s.stage === "PUBLISHED_LINK" && s.status === "APPROVED"
          );
          return isClipping ? publishApproved : draftApproved && publishApproved;
        });
        return ready;
      })
      .map((contract) => {
        const fixedFee = Number(contract.requirement.compensation?.fixedFeeAmount ?? 0);
        const cpvRate = Number(contract.requirement.compensation?.cpvRatePer1000 ?? 0);
        const views = contract.performanceReport?.viewsCount ?? 0;
        const cpvEstimate = cpvRate > 0 ? (cpvRate * views) / 1000 : 0;
        return {
          contractId: contract.id,
          campaignTitle: contract.requirement.title,
          brandName: contract.requirement.business?.brandName ?? "Brand",
          fixedFeeReceivable: fixedFee,
          cpvClaimableEstimate: cpvEstimate,
          totalEstimatedReceivable: fixedFee + cpvEstimate,
          viewsCount: views,
          status: "ACTIVE_RECEIVABLE"
        };
      });
    return NextResponse.json({ data: payouts, receivables: activeReceivables });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

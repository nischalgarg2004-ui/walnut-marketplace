import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePayout } from "@/lib/payment";
import { RazorpayProvider } from "@/lib/payments/razorpay";

const payoutSchema = z.object({
  contractId: z.string().min(10),
  viewsCount: z.number().int().min(0).default(0)
});

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const payload = payoutSchema.parse(await req.json());

    const contract = await db.contract.findUnique({
      where: { id: payload.contractId },
      include: {
        requirement: { include: { compensation: true } },
        performanceReport: true
      }
    });
    if (!contract || !contract.requirement.compensation) {
      return NextResponse.json({ error: "Contract or compensation not found" }, { status: 404 });
    }

    const cpvRate = Number(contract.requirement.compensation.cpvRatePer1000 ?? 0);
    const requireVerified =
      cpvRate > 0 && process.env.CPV_PAYOUT_REQUIRE_VERIFIED !== "0";
    if (requireVerified && contract.performanceReport?.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "CPV payout requires verified view metrics. Run metrics sync or verify performance first." },
        { status: 400 }
      );
    }
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== contract.businessId) {
        return NextResponse.json({ error: "Cannot trigger payout for another brand's contract" }, { status: 403 });
      }
    }

    const commissionPercent = Number(process.env.COMMISSION_PERCENT ?? "15");
    const fixedFeeAmount = Number(contract.requirement.compensation.fixedFeeAmount ?? 0);
    const cpvRatePer1000 = Number(contract.requirement.compensation.cpvRatePer1000 ?? 0);
    const calc = calculatePayout({
      fixedFeeAmount,
      cpvRatePer1000,
      viewsCount: payload.viewsCount,
      commissionPercent
    });

    const payout = await db.payout.create({
      data: {
        contractId: contract.id,
        fixedComponentAmount: calc.fixedComponentAmount,
        cpvComponentAmount: calc.cpvComponentAmount,
        grossAmount: calc.grossAmount,
        commissionAmount: calc.commissionAmount,
        netAmount: calc.netAmount,
        payoutProvider: "RAZORPAY",
        status: "PROCESSING"
      }
    });

    const provider = new RazorpayProvider();
    const providerResult = await provider.createPayout({
      payoutId: payout.id,
      amountInPaise: Math.round(calc.netAmount * 100),
      notes: { payoutId: payout.id, contractId: contract.id }
    });

    const updatedPayout = await db.payout.update({
      where: { id: payout.id },
      data: {
        payoutRef: providerResult.providerRef,
        status: providerResult.status === "failed" ? "FAILED" : "PROCESSING"
      }
    });

    return NextResponse.json({ data: updatedPayout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

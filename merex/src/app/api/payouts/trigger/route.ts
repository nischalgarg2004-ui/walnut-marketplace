import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";
import { calculatePayout } from "@/lib/payment";
import { RazorpayProvider } from "@/lib/payments/razorpay";
import { releaseFundsForContract, toDecimal, WalletFundsError } from "@/lib/wallet-liability";

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
        performanceReport: true,
        deliverables: true,
        barterShipment: true,
        payouts: { where: { status: { in: ["PENDING", "PROCESSING", "PAID"] } }, take: 1 },
        creator: { select: { userId: true } }
      }
    });
    if (!contract || !contract.requirement.compensation) {
      return NextResponse.json({ error: "Contract or compensation not found" }, { status: 404 });
    }
    if (contract.status !== "ACTIVE" && contract.status !== "COMPLETED") {
      return NextResponse.json({ error: "Contract must be ACTIVE or COMPLETED for payout" }, { status: 400 });
    }
    if (contract.payouts.length > 0) {
      return NextResponse.json({ error: "A payout already exists or is processing for this contract" }, { status: 400 });
    }
    const allApproved = contract.deliverables.every((d) => d.status === "APPROVED" || d.status === "PUBLISHED");
    if (!allApproved) {
      return NextResponse.json({ error: "All deliverables must be approved before payout" }, { status: 400 });
    }
    if (contract.requirement.compensation.hasBarter && contract.barterShipment?.status !== "RECEIVED") {
      return NextResponse.json({ error: "Barter shipment must be marked RECEIVED before payout" }, { status: 400 });
    }

    const cpvRate = Number(contract.requirement.compensation.cpvRatePer1000 ?? 0);
    const requireVerified =
      cpvRate > 0 && process.env.CPV_PAYOUT_REQUIRE_VERIFIED !== "0";
    const prStatus = contract.performanceReport?.status;
    const metricsOkForCpv = prStatus === "VERIFIED";
    if (requireVerified && !metricsOkForCpv) {
      return NextResponse.json(
        {
          error: "CPV payout needs verified Instagram Graph metrics before payout trigger."
        },
        { status: 400 }
      );
    }
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== contract.businessId) {
        return NextResponse.json({ error: "Cannot trigger payout for another brand's contract" }, { status: 403 });
      }
    }
    const wallet = await db.walletAccount.findUnique({ where: { businessId: contract.businessId } });
    if (!wallet) {
      return NextResponse.json({ error: "WALLET_NOT_FOUND" }, { status: 400 });
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

    const payout = await db.$transaction(async (tx) => {
      const released = await releaseFundsForContract(tx, {
        walletId: wallet.id,
        contractId: contract.id,
        note: "Released reserved commitment at payout trigger"
      });
      const netAmount = toDecimal(calc.netAmount);
      const availableWallet = await tx.walletAccount.findUnique({ where: { id: wallet.id } });
      if (released < calc.netAmount) {
        const remaining = calc.netAmount - released;
        if (!availableWallet || availableWallet.availableBalance.lt(toDecimal(remaining))) {
          throw new WalletFundsError("INSUFFICIENT_AVAILABLE_BALANCE_FOR_PAYOUT");
        }
        await tx.walletAccount.update({
          where: { id: wallet.id },
          data: { availableBalance: { decrement: toDecimal(remaining) } }
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "RELEASE",
            status: "COMPLETED",
            amount: toDecimal(remaining),
            description: "Direct wallet debit for payout (legacy/no reserve path)",
            reference: `PAYOUT-DEBIT-${contract.id}`,
            metadata: { contractId: contract.id }
          }
        });
      }
      return tx.payout.create({
        data: {
          contractId: contract.id,
          fixedComponentAmount: calc.fixedComponentAmount,
          cpvComponentAmount: calc.cpvComponentAmount,
          grossAmount: calc.grossAmount,
          commissionAmount: calc.commissionAmount,
          netAmount,
          payoutProvider: "RAZORPAY",
          status: "PROCESSING"
        }
      });
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
    await writeAudit({
      actorUserId: user.userId,
      entityType: "Payout",
      entityId: updatedPayout.id,
      action: "PAYOUT_TRIGGERED",
      metadata: { contractId: contract.id, netAmount: calc.netAmount, views: payload.viewsCount }
    });
    await notifyUser({
      userId: contract.creator.userId,
      type: "PAYOUT",
      title: "Payout initiated",
      body: "A payout has been initiated for your approved deal."
    });

    return NextResponse.json({ data: updatedPayout }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "UNAUTHORIZED"
          ? 401
          : message === "INSUFFICIENT_AVAILABLE_BALANCE_FOR_PAYOUT" || message === "INSUFFICIENT_AVAILABLE_BALANCE"
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

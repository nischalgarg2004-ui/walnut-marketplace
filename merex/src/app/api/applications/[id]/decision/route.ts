import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";
import { createDeliverablesForContract } from "@/lib/seed-contract-deliverables";
import { featureFlags } from "@/lib/feature-flags";
import { reserveFundsForContract, WalletFundsError } from "@/lib/wallet-liability";
import { decisionSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id } = await params;
    const payload = decisionSchema.parse(await req.json());

    const application = await db.application.findUnique({
      where: { id },
      include: {
        creator: true,
        requirement: { include: { compensation: true } }
      }
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== application.requirement.businessId) {
        return NextResponse.json({ error: "Cannot decide on another brand's application" }, { status: 403 });
      }
    }

    const existingContract = await db.contract.findUnique({
      where: { applicationId: application.id }
    });
    if (existingContract && payload.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Cannot change application away from APPROVED once a contract exists" },
        { status: 400 }
      );
    }
    if (application.status === "REJECTED" && payload.status === "APPROVED") {
      return NextResponse.json({ error: "Cannot approve a rejected application" }, { status: 400 });
    }

    const updated = await db.application.update({
      where: { id },
      data: {
        status: payload.status,
        decisionReason: payload.reason,
        decisionAt: new Date()
      }
    });

    if (payload.status === "APPROVED") {
      const termsSnapshot = {
        requirementId: application.requirementId,
        creatorId: application.creatorId,
        approvedAt: new Date().toISOString()
      };

      if (!existingContract) {
        await db.$transaction(async (tx) => {
          const wallet = await tx.walletAccount.findUnique({
            where: { businessId: application.requirement.businessId }
          });
          const contract = await tx.contract.create({
            data: {
              requirementId: application.requirementId,
              creatorId: application.creatorId,
              businessId: application.requirement.businessId,
              applicationId: application.id,
              termsSnapshotJson: termsSnapshot
            }
          });
          await createDeliverablesForContract(tx, {
            contractId: contract.id,
            creatorId: application.creatorId,
            requirement: application.requirement
          });
          const fixedFee = Number(application.requirement.compensation?.fixedFeeAmount ?? 0);
          if (fixedFee > 0 && featureFlags.walletLiabilityGates) {
            if (!wallet) {
              throw new WalletFundsError("WALLET_NOT_FOUND");
            }
            await reserveFundsForContract(tx, {
              walletId: wallet.id,
              contractId: contract.id,
              requirementId: application.requirementId,
              amount: fixedFee,
              note: "Reserved fixed fee on application approval"
            });
          }
          if (application.requirement.compensation?.hasBarter) {
            await tx.barterShipment.create({
              data: { contractId: contract.id }
            });
          }
        });
      }
    }

    await writeAudit({
      actorUserId: user.userId,
      entityType: "Application",
      entityId: application.id,
      action: `DECISION_${payload.status}`,
      metadata: { reason: payload.reason ?? null }
    });
    await notifyUser({
      userId: application.creator.userId,
      type: "APPLICATION_DECISION",
      title: `Application ${payload.status.toLowerCase()}`,
      body: `Your application for "${application.requirement.title}" is now ${payload.status.toLowerCase()}.`
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "UNAUTHORIZED"
          ? 401
          : message === "INSUFFICIENT_AVAILABLE_BALANCE"
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

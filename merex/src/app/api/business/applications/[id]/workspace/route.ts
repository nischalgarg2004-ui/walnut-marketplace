import {
  BarterShipmentStatus,
  ClippingLifecycleStatus,
  ContractStatus,
  PayoutStatus,
  UserRole
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { notifyUser, writeAudit } from "@/lib/activity-log";
import { trackEvent } from "@/lib/analytics";

const bodySchema = z.object({
  contractStatus: z.nativeEnum(ContractStatus).optional(),
  productSentStatus: z.nativeEnum(BarterShipmentStatus).optional(),
  paymentStatus: z.nativeEnum(PayoutStatus).optional(),
  clippingLifecycleStatus: z.nativeEnum(ClippingLifecycleStatus).optional(),
  clippingReviewReason: z.string().max(500).optional(),
  internalNote: z.string().max(1000).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id } = await params;
    const payload = bodySchema.parse(await req.json());

    const application = await db.application.findUnique({
      where: { id },
      include: {
        creator: {
          select: { userId: true }
        },
        requirement: true,
        contract: {
          include: {
            barterShipment: true,
            payouts: true
          }
        }
      }
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== application.requirement.businessId) {
        return NextResponse.json({ error: "Cannot update another brand's application" }, { status: 403 });
      }
    }

    if (payload.contractStatus && !application.contract) {
      return NextResponse.json({ error: "No contract available for this application yet." }, { status: 400 });
    }
    if (payload.productSentStatus && !application.contract) {
      return NextResponse.json({ error: "No contract available for product shipment update." }, { status: 400 });
    }
    if (payload.paymentStatus && (!application.contract || application.contract.payouts.length === 0)) {
      return NextResponse.json({ error: "No payout exists yet for payment status update." }, { status: 400 });
    }
    if (payload.clippingLifecycleStatus && application.requirement.category !== "CLIPPING") {
      return NextResponse.json({ error: "Clipping updates allowed only for clipping campaigns." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      if (payload.internalNote !== undefined) {
        await tx.application.update({
          where: { id: application.id },
          data: { decisionReason: payload.internalNote }
        });
      }
      if (payload.clippingLifecycleStatus) {
        await tx.application.update({
          where: { id: application.id },
          data: {
            clippingLifecycleStatus: payload.clippingLifecycleStatus,
            decisionReason:
              payload.clippingReviewReason ??
              payload.internalNote ??
              application.decisionReason,
            clippingVerifiedAt:
              payload.clippingLifecycleStatus === ClippingLifecycleStatus.VERIFIED
                ? new Date()
                : application.clippingVerifiedAt
          }
        });
      }
      if (payload.contractStatus && application.contract) {
        await tx.contract.update({
          where: { id: application.contract.id },
          data: { status: payload.contractStatus }
        });
      }
      if (payload.productSentStatus && application.contract) {
        if (application.contract.barterShipment) {
          await tx.barterShipment.update({
            where: { contractId: application.contract.id },
            data: { status: payload.productSentStatus }
          });
        } else {
          await tx.barterShipment.create({
            data: {
              contractId: application.contract.id,
              status: payload.productSentStatus
            }
          });
        }
      }
      if (payload.paymentStatus && application.contract && application.contract.payouts.length > 0) {
        const latestPayout = application.contract.payouts[0];
        await tx.payout.update({
          where: { id: latestPayout.id },
          data: { status: payload.paymentStatus }
        });
      }
    });

    if (payload.clippingLifecycleStatus) {
      await trackEvent(user.userId, "CLIPPING_REVIEW_STATUS_UPDATED", {
        applicationId: application.id,
        requirementId: application.requirementId,
        status: payload.clippingLifecycleStatus
      });
      await writeAudit({
        actorUserId: user.userId,
        entityType: "Application",
        entityId: application.id,
        action: `CLIPPING_${payload.clippingLifecycleStatus}`,
        metadata: {
          reason: payload.clippingReviewReason ?? payload.internalNote ?? null
        }
      });
      await notifyUser({
        userId: application.creator.userId,
        type: "CLIPPING_LIFECYCLE",
        title: `Clipping update: ${payload.clippingLifecycleStatus}`,
        body:
          payload.clippingReviewReason?.trim() ||
          `Your clipping submission moved to ${payload.clippingLifecycleStatus}.`
      });
    }

    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update workspace row";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

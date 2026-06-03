import {
  DeliverableStatus,
  DeliverableSubmissionStage,
  DeliverableSubmissionStatus,
  UserRole
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";
import { reserveFundsForContract, WalletFundsError } from "@/lib/wallet-liability";

const reviewSchema = z.object({
  stage: z.enum(["DRAFT", "PUBLISHED_LINK"]).optional(),
  action: z.enum(["APPROVE", "REQUEST_REVISION"]),
  feedback: z.string().max(1000).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id } = await params;
    const payload = reviewSchema.parse(await req.json());

    const deliverable = await db.deliverable.findUnique({
      where: { id },
      include: {
        contract: { include: { requirement: true } },
        submissions: { orderBy: { submittedAt: "desc" } }
      }
    });
    if (!deliverable) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== deliverable.contract.businessId) {
        return NextResponse.json({ error: "Cannot review another brand's deliverable" }, { status: 403 });
      }
    }

    const stage =
      payload.stage === "PUBLISHED_LINK"
        ? DeliverableSubmissionStage.PUBLISHED_LINK
        : DeliverableSubmissionStage.DRAFT;
    const isClipping = deliverable.contract.requirement.category === "CLIPPING";
    if (isClipping && stage === DeliverableSubmissionStage.DRAFT) {
      return NextResponse.json({ error: "CLIPPING_DEALS_SKIP_DRAFT_STAGE" }, { status: 400 });
    }
    if (!isClipping && stage === DeliverableSubmissionStage.PUBLISHED_LINK) {
      const hasDraftApproved = deliverable.submissions.some(
        (s) => s.stage === DeliverableSubmissionStage.DRAFT && s.status === DeliverableSubmissionStatus.APPROVED
      );
      if (!hasDraftApproved) {
        return NextResponse.json({ error: "DRAFT_APPROVAL_REQUIRED_BEFORE_PUBLISH_LINK_REVIEW" }, { status: 400 });
      }
    }
    const submissionStatus =
      payload.action === "APPROVE"
        ? DeliverableSubmissionStatus.APPROVED
        : DeliverableSubmissionStatus.REVISION_REQUESTED;
    const status =
      stage === DeliverableSubmissionStage.PUBLISHED_LINK
        ? payload.action === "APPROVE"
          ? DeliverableStatus.APPROVED
          : DeliverableStatus.REVISION_REQUESTED
        : payload.action === "APPROVE"
          ? DeliverableStatus.APPROVED
          : DeliverableStatus.REVISION_REQUESTED;
    const updated = await db.$transaction(async (tx) => {
      if (payload.action === "APPROVE" && stage === DeliverableSubmissionStage.DRAFT) {
        const contract = await tx.contract.findUnique({
          where: { id: deliverable.contractId },
          include: { requirement: { include: { compensation: true } } }
        });
        if (contract?.requirement.compensation?.fixedFeeAmount) {
          const wallet = await tx.walletAccount.findUnique({ where: { businessId: contract.businessId } });
          if (!wallet) throw new WalletFundsError("WALLET_NOT_FOUND");
          const existingActive = await tx.walletCommitment.findFirst({
            where: { contractId: contract.id, walletId: wallet.id, status: "ACTIVE" }
          });
          if (!existingActive) {
            await reserveFundsForContract(tx, {
              walletId: wallet.id,
              contractId: contract.id,
              requirementId: contract.requirementId,
              amount: Number(contract.requirement.compensation.fixedFeeAmount),
              note: "Reserved fixed fee on draft approval"
            });
          }
        }
      }
      return tx.deliverable.update({
        where: { id },
        data: {
          status,
          feedback: payload.feedback,
          submissions: {
            create: {
              stage,
              status: submissionStatus,
              url: deliverable.externalUrl || deliverable.fileUrl,
              fileType: deliverable.fileType,
              feedback: payload.feedback,
              submittedBy: user.role,
              reviewedAt: new Date()
            }
          }
        }
      });
    });
    const creator = await db.creatorProfile.findUnique({
      where: { id: deliverable.creatorId },
      select: { userId: true }
    });
    await writeAudit({
      actorUserId: user.userId,
      entityType: "Deliverable",
      entityId: deliverable.id,
      action:
        status === "APPROVED"
          ? stage === DeliverableSubmissionStage.DRAFT
            ? "DELIVERABLE_DRAFT_APPROVED"
            : "DELIVERABLE_PUBLISH_LINK_APPROVED"
          : stage === DeliverableSubmissionStage.DRAFT
            ? "DELIVERABLE_DRAFT_REVISION_REQUESTED"
            : "DELIVERABLE_PUBLISH_LINK_REVISION_REQUESTED",
      metadata: { feedback: payload.feedback ?? null, stage }
    });
    if (creator) {
      await notifyUser({
        userId: creator.userId,
        type: "DELIVERABLE_REVIEW",
        title: status === "APPROVED" ? "Deliverable approved" : "Revision requested",
        body:
          status === "APPROVED"
            ? "Your deliverable was approved by the brand."
            : payload.feedback || "Brand requested revisions on your deliverable."
      });
    }

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

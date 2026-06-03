import {
  ContractStatus,
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
import { featureFlags } from "@/lib/feature-flags";

const bodySchema = z.object({
  stage: z.enum(["DRAFT", "PUBLISHED_LINK"]),
  url: z.string().url(),
  fileType: z.string().min(2).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const payload = bodySchema.parse(await req.json());
    const { id } = await params;

    const deliverable = await db.deliverable.findUnique({
      where: { id },
      include: { contract: { include: { requirement: true } }, submissions: { orderBy: { submittedAt: "desc" } } }
    });
    if (!deliverable) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }
    if (deliverable.contract.status !== ContractStatus.ACTIVE) {
      return NextResponse.json({ error: "Contract must be ACTIVE for submission" }, { status: 400 });
    }
    if (user.role === UserRole.CREATOR) {
      const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
      if (!creator || creator.id !== deliverable.creatorId) {
        return NextResponse.json({ error: "Cannot submit for another creator's deliverable" }, { status: 403 });
      }
    }

    const stage =
      payload.stage === "PUBLISHED_LINK"
        ? DeliverableSubmissionStage.PUBLISHED_LINK
        : DeliverableSubmissionStage.DRAFT;
    if (!featureFlags.stageAwareDeliverables && stage === DeliverableSubmissionStage.PUBLISHED_LINK) {
      return NextResponse.json({ error: "FEATURE_STAGE_AWARE_DELIVERABLES_DISABLED" }, { status: 409 });
    }
    const isClipping = deliverable.contract.requirement.category === "CLIPPING";
    if (isClipping && stage === DeliverableSubmissionStage.DRAFT) {
      return NextResponse.json({ error: "CLIPPING_DEALS_SKIP_DRAFT_STAGE" }, { status: 400 });
    }
    if (!isClipping && stage === DeliverableSubmissionStage.PUBLISHED_LINK) {
      const hasDraftApproved = deliverable.submissions.some(
        (s) => s.stage === DeliverableSubmissionStage.DRAFT && s.status === DeliverableSubmissionStatus.APPROVED
      );
      if (!hasDraftApproved) {
        return NextResponse.json({ error: "DRAFT_APPROVAL_REQUIRED_BEFORE_PUBLISH_LINK" }, { status: 400 });
      }
    }
    const nextStatus = stage === DeliverableSubmissionStage.DRAFT ? DeliverableStatus.SUBMITTED : DeliverableStatus.PUBLISHED;

    const updated = await db.deliverable.update({
      where: { id: deliverable.id },
      data: {
        fileUrl: payload.url,
        externalUrl: payload.url,
        fileType: payload.fileType ?? "link",
        status: nextStatus,
        submittedAt: new Date(),
        feedback: null,
        submissions: {
          create: {
            stage,
            status: DeliverableSubmissionStatus.SUBMITTED,
            url: payload.url,
            fileType: payload.fileType,
            submittedBy: user.role
          }
        }
      },
      include: {
        submissions: { orderBy: { submittedAt: "desc" }, take: 5 }
      }
    });

    const business = await db.businessProfile.findUnique({ where: { id: deliverable.contract.businessId } }).catch(() => null);
    await writeAudit({
      actorUserId: user.userId,
      entityType: "Deliverable",
      entityId: deliverable.id,
      action: stage === DeliverableSubmissionStage.DRAFT ? "DELIVERABLE_DRAFT_SUBMITTED" : "DELIVERABLE_PUBLISH_LINK_SUBMITTED",
      metadata: { stage, contractId: deliverable.contractId, slotIndex: deliverable.slotIndex ?? null }
    });
    if (business) {
      await notifyUser({
        userId: business.userId,
        type: "DELIVERABLE",
        title:
          stage === DeliverableSubmissionStage.DRAFT
            ? "New draft submitted"
            : "Instagram publish link submitted",
        body: "A creator submitted an item for review."
      });
    }

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


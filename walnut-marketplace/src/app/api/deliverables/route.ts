import { ContractStatus, DeliverableStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";

const deliverableSchema = z.object({
  contractId: z.string().min(10),
  fileUrl: z.string().url(),
  fileType: z.string().min(2),
  deliverableId: z.string().min(10).optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const payload = deliverableSchema.parse(await req.json());

    const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });

    const contract = await db.contract.findUnique({
      where: { id: payload.contractId },
      select: { id: true, creatorId: true, status: true }
    });
    if (!contract || contract.creatorId !== creator.id) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (contract.status !== ContractStatus.ACTIVE) {
      return NextResponse.json({ error: "Contract must be ACTIVE for submission" }, { status: 400 });
    }

    const whereSlot = payload.deliverableId
      ? {
          id: payload.deliverableId,
          contractId: contract.id,
          creatorId: creator.id
        }
      : {
          contractId: contract.id,
          creatorId: creator.id,
          status: { in: [DeliverableStatus.PENDING, DeliverableStatus.REVISION_REQUESTED] as DeliverableStatus[] }
        };
    const slot = await db.deliverable.findFirst({
      where: whereSlot,
      include: { contract: { select: { businessId: true } } },
      orderBy: { slotIndex: "asc" }
    });
    if (!slot) {
      return NextResponse.json({ error: "No eligible deliverable slot found" }, { status: 400 });
    }
    if (slot.status !== DeliverableStatus.PENDING && slot.status !== DeliverableStatus.REVISION_REQUESTED) {
      return NextResponse.json({ error: "Deliverable slot is not open for submission" }, { status: 400 });
    }

    const created = await db.deliverable.update({
      where: { id: slot.id },
      data: {
        fileUrl: payload.fileUrl,
        externalUrl: payload.fileUrl,
        fileType: payload.fileType,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date(),
        feedback: null
      }
    });
    const business = await db.businessProfile.findUnique({ where: { id: slot.contract.businessId } }).catch(() => null);
    await writeAudit({
      actorUserId: user.userId,
      entityType: "Deliverable",
      entityId: created.id,
      action: "DELIVERABLE_SUBMITTED",
      metadata: { contractId: contract.id, slotIndex: slot.slotIndex ?? null }
    });
    if (business) {
      await notifyUser({
        userId: business.userId,
        type: "DELIVERABLE",
        title: "New deliverable submitted",
        body: "A creator submitted a deliverable for review."
      });
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

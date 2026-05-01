import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";

const reviewSchema = z.object({
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
      include: { contract: true }
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

    const status = payload.action === "APPROVE" ? "APPROVED" : "REVISION_REQUESTED";
    const updated = await db.deliverable.update({
      where: { id },
      data: {
        status,
        feedback: payload.feedback
      }
    });
    const creator = await db.creatorProfile.findUnique({
      where: { id: deliverable.creatorId },
      select: { userId: true }
    });
    await writeAudit({
      actorUserId: user.userId,
      entityType: "Deliverable",
      entityId: deliverable.id,
      action: status === "APPROVED" ? "DELIVERABLE_APPROVED" : "DELIVERABLE_REVISION_REQUESTED",
      metadata: { feedback: payload.feedback ?? null }
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
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

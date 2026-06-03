import { BarterShipmentStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";

const bodySchema = z.object({
  action: z.enum(["MARK_SHIPPED"]),
  trackingHint: z.string().max(200).optional()
});

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { contractId } = await params;
    const payload = bodySchema.parse(await req.json());

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { barterShipment: true, creator: { select: { userId: true } }, requirement: { select: { title: true } } }
    });
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== contract.businessId) {
        return NextResponse.json({ error: "Cannot update shipment for another brand's contract" }, { status: 403 });
      }
    }
    if (!contract.barterShipment) {
      return NextResponse.json({ error: "No barter shipment for this contract" }, { status: 400 });
    }

    const updated = await db.barterShipment.update({
      where: { contractId },
      data: {
        status: BarterShipmentStatus.SHIPPED,
        shippedAt: new Date(),
        trackingHint: payload.trackingHint?.trim() || null
      }
    });
    await writeAudit({
      actorUserId: user.userId,
      entityType: "BarterShipment",
      entityId: updated.id,
      action: "SHIPMENT_MARKED_SHIPPED",
      metadata: { contractId }
    });
    await notifyUser({
      userId: contract.creator.userId,
      type: "SHIPMENT",
      title: "Product shipped",
      body: `Brand marked shipment as shipped for "${contract.requirement.title}".`
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


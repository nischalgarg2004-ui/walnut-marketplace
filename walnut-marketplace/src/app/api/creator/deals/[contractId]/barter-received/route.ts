import { BarterShipmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireConnectedCreator } from "@/lib/creator-access";
import { db } from "@/lib/db";
import { notifyUser, writeAudit } from "@/lib/activity-log";

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { user, creatorProfileId } = await requireConnectedCreator(req);
    const { contractId } = await params;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { barterShipment: true, requirement: { include: { business: { select: { userId: true }, } } } }
    });
    if (!contract || contract.creatorId !== creatorProfileId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (!contract.barterShipment) {
      return NextResponse.json({ error: "No barter shipment for this deal" }, { status: 400 });
    }
    if (contract.barterShipment.status !== BarterShipmentStatus.SHIPPED) {
      return NextResponse.json(
        { error: "Shipment must be marked SHIPPED by the brand before confirming receipt" },
        { status: 400 }
      );
    }

    const updated = await db.barterShipment.update({
      where: { contractId },
      data: {
        status: BarterShipmentStatus.RECEIVED,
        receivedAt: new Date(),
        acknowledgedByUserId: user.userId
      }
    });
    await writeAudit({
      actorUserId: user.userId,
      entityType: "BarterShipment",
      entityId: updated.id,
      action: "SHIPMENT_MARKED_RECEIVED",
      metadata: { contractId }
    });
    await notifyUser({
      userId: contract.requirement.business.userId,
      type: "SHIPMENT",
      title: "Product received by creator",
      body: `Creator confirmed receiving barter product for "${contract.requirement.title}".`
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

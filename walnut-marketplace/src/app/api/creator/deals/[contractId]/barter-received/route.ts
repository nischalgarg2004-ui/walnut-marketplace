import { BarterShipmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireConnectedCreator } from "@/lib/creator-access";
import { db } from "@/lib/db";

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { user, creatorProfileId } = await requireConnectedCreator(req);
    const { contractId } = await params;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { barterShipment: true }
    });
    if (!contract || contract.creatorId !== creatorProfileId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (!contract.barterShipment) {
      return NextResponse.json({ error: "No barter shipment for this deal" }, { status: 400 });
    }

    const updated = await db.barterShipment.update({
      where: { contractId },
      data: {
        status: BarterShipmentStatus.RECEIVED,
        receivedAt: new Date(),
        acknowledgedByUserId: user.userId
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

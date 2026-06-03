import { ContractStatus } from "@prisma/client";
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
      include: { requirement: { include: { compensation: true, business: { select: { userId: true, brandName: true } } } } }
    });
    if (!contract || contract.creatorId !== creatorProfileId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    if (contract.status !== ContractStatus.PENDING) {
      return NextResponse.json({ error: "Contract is not pending acceptance" }, { status: 400 });
    }

    let deliveryEtaAt: Date | null = null;
    const r = contract.requirement;
    if (r.deliveryDueAt) {
      deliveryEtaAt = r.deliveryDueAt;
    } else if (r.deliveryDueOffsetDays != null) {
      deliveryEtaAt = new Date(Date.now() + r.deliveryDueOffsetDays * 86400000);
    }

    const updated = await db.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.ACTIVE,
        acceptedAt: new Date(),
        deliveryEtaAt
      }
    });

    if (contract.requirement.compensation?.hasBarter) {
      await db.barterShipment.upsert({
        where: { contractId },
        create: { contractId },
        update: {}
      });
    }

    await writeAudit({
      actorUserId: user.userId,
      entityType: "Contract",
      entityId: contractId,
      action: "CONTRACT_ACCEPTED"
    });
    await notifyUser({
      userId: contract.requirement.business.userId,
      type: "CONTRACT",
      title: "Contract accepted",
      body: `Creator accepted contract for "${contract.requirement.title}".`
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

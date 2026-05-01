import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireConnectedCreator } from "@/lib/creator-access";

export async function GET(req: NextRequest) {
  try {
    const { creatorProfileId } = await requireConnectedCreator(req);
    const items = await db.application.findMany({
      where: { creatorId: creatorProfileId },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        requirement: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            business: { select: { brandName: true } }
          }
        },
        clippingLifecycleStatus: true,
        clippingDestinationHandle: true,
        clippingSampleUrl: true,
        clippingFinalUrl: true,
        clippingVerifiedAt: true,
        decisionReason: true
      },
      orderBy: { appliedAt: "desc" }
    });
    return NextResponse.json({ data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

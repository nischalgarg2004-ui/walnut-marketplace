import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireConnectedCreator } from "@/lib/creator-access";

export async function GET(req: NextRequest) {
  try {
    const { creatorProfileId } = await requireConnectedCreator(req);
    const payouts = await db.payout.findMany({
      where: { contract: { creatorId: creatorProfileId } },
      include: {
        contract: {
          select: {
            requirement: { select: { title: true } },
            business: { select: { brandName: true } }
          }
        }
      },
      orderBy: { releasedAt: "desc" }
    });
    return NextResponse.json({ data: payouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

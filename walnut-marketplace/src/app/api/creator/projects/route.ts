import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireConnectedCreator } from "@/lib/creator-access";

export async function GET(req: NextRequest) {
  try {
    const { creatorProfileId } = await requireConnectedCreator(req);
    const contracts = await db.contract.findMany({
      where: { creatorId: creatorProfileId },
      include: {
        requirement: { select: { title: true } },
        deliverables: {
          select: { id: true, status: true, submittedAt: true },
          orderBy: { submittedAt: "desc" }
        }
      },
      orderBy: { acceptedAt: "desc" }
    });
    return NextResponse.json({ data: contracts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

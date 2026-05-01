import { NextRequest, NextResponse } from "next/server";
import { requireCreatorProfile } from "@/lib/creator-access";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { creatorProfileId } = await requireCreatorProfile(req);

    const applications = await db.application.findMany({
      where: { creatorId: creatorProfileId },
      include: {
        requirement: {
          include: { business: { select: { brandName: true } }, compensation: true }
        },
        contract: {
          include: {
            deliverables: { orderBy: { submittedAt: "desc" } },
            barterShipment: true,
            performanceReport: true,
            metricSnapshots: { orderBy: { capturedAt: "desc" }, take: 5 },
            payouts: { orderBy: { releasedAt: "desc" }, take: 3 }
          }
        }
      },
      orderBy: { appliedAt: "desc" }
    });

    return NextResponse.json({ data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

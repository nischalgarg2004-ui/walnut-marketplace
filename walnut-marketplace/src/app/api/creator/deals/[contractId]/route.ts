import { NextRequest, NextResponse } from "next/server";
import { requireCreatorProfile } from "@/lib/creator-access";
import { db } from "@/lib/db";

type Params = { params: Promise<{ contractId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { creatorProfileId } = await requireCreatorProfile(req);
    const { contractId } = await params;

    const application = await db.application.findFirst({
      where: {
        creatorId: creatorProfileId,
        contract: { id: contractId }
      },
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
            payouts: { orderBy: { releasedAt: "desc" }, take: 5 }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

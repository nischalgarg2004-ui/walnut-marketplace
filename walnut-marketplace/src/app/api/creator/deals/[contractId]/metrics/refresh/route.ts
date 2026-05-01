import { ContractStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireCreatorProfile } from "@/lib/creator-access";
import { db } from "@/lib/db";
import { syncContractMetrics } from "@/lib/metrics-sync";

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { creatorProfileId } = await requireCreatorProfile(req);
    const { contractId } = await params;

    const contract = await db.contract.findFirst({
      where: { id: contractId, creatorId: creatorProfileId, status: ContractStatus.ACTIVE },
      include: {
        deliverables: {
          orderBy: { submittedAt: "desc" },
          select: { id: true, expectedKind: true, instagramMediaId: true, externalUrl: true }
        }
      }
    });
    if (!contract) {
      return NextResponse.json({ error: "Active contract not found" }, { status: 404 });
    }

    const sync = await syncContractMetrics(contractId);
    if (!sync) {
      return NextResponse.json({ error: "Could not sync metrics" }, { status: 400 });
    }

    const snap = await db.metricSnapshot.findFirst({
      where: { contractId },
      orderBy: { capturedAt: "desc" }
    });

    return NextResponse.json({
      data: {
        views: sync.views,
        source: sync.source,
        capturedAt: snap?.capturedAt.toISOString() ?? null,
        diagnostics: {
          selectedDeliverableMediaId:
            contract.deliverables.find((d) => d.expectedKind === "REEL" && d.externalUrl)?.instagramMediaId ??
            contract.deliverables.find((d) => d.instagramMediaId)?.instagramMediaId ??
            null
        },
        message:
          sync.source === "INSTAGRAM_GRAPH_UNAVAILABLE"
            ? "Instagram Graph was unavailable. Showing last known metrics."
            : sync.message ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

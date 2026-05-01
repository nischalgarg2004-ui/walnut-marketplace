import { ContractStatus, ContentSource, DeliverableStatus, RequirementDeliverableKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatorProfile } from "@/lib/creator-access";
import { db } from "@/lib/db";
import { normalizeInstagramReelUrl } from "@/lib/integrations/instagram-reel-scrape";
import {
  decryptTokenFromStorage,
  resolveInstagramMediaIdFromPermalink
} from "@/lib/integrations/instagram";
import { syncContractMetrics } from "@/lib/metrics-sync";

const bodySchema = z.object({ reelUrl: z.string().min(8) });

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { creatorProfileId } = await requireCreatorProfile(req);
    const { contractId } = await params;
    const payload = bodySchema.parse(await req.json());
    const canonical = normalizeInstagramReelUrl(payload.reelUrl);
    if (!canonical) {
      return NextResponse.json({ error: "Invalid Instagram reel or post URL" }, { status: 400 });
    }

    const contract = await db.contract.findFirst({
      where: { id: contractId, creatorId: creatorProfileId, status: ContractStatus.ACTIVE }
    });
    if (!contract) {
      return NextResponse.json({ error: "Active contract not found" }, { status: 404 });
    }

    const pendingReel = await db.deliverable.findFirst({
      where: {
        contractId,
        creatorId: creatorProfileId,
        status: { in: [DeliverableStatus.PENDING, DeliverableStatus.REVISION_REQUESTED] },
        expectedKind: RequirementDeliverableKind.REEL
      },
      orderBy: { slotIndex: "asc" }
    });
    const pendingAny = await db.deliverable.findFirst({
      where: {
        contractId,
        creatorId: creatorProfileId,
        status: { in: [DeliverableStatus.PENDING, DeliverableStatus.REVISION_REQUESTED] }
      },
      orderBy: { slotIndex: "asc" }
    });
    const existingSubmittedReel = await db.deliverable.findFirst({
      where: {
        contractId,
        creatorId: creatorProfileId,
        expectedKind: RequirementDeliverableKind.REEL
      },
      orderBy: [{ submittedAt: "desc" }, { slotIndex: "asc" }]
    });
    const existing = pendingReel ?? pendingAny ?? existingSubmittedReel;

    let resolvedMediaId: string | null = null;
    if (existing) {
      const profile = await db.creatorProfile.findUnique({ where: { id: creatorProfileId } });
      const accessToken = profile?.instagramAccessTokenEncrypted
        ? decryptTokenFromStorage(profile.instagramAccessTokenEncrypted)
        : process.env.GRAPH_API_TOKEN ?? null;
      resolvedMediaId = accessToken
        ? await resolveInstagramMediaIdFromPermalink({
            accessToken,
            permalink: canonical
          }).catch(() => null)
        : null;
      await db.deliverable.update({
        where: { id: existing.id },
        data: {
          externalUrl: canonical,
          ...(resolvedMediaId ? { instagramMediaId: resolvedMediaId } : {}),
          contentSource: ContentSource.CREATOR_URL,
          fileType: "reel",
          ...(existing.status === DeliverableStatus.PENDING || existing.status === DeliverableStatus.REVISION_REQUESTED
            ? {
                status: DeliverableStatus.SUBMITTED,
                submittedAt: new Date(),
                feedback: null
              }
            : {})
        }
      });
    } else {
      return NextResponse.json(
        { error: "No eligible deliverable slot found. Add a REEL deliverable or reopen a slot." },
        { status: 400 }
      );
    }

    const sync = await syncContractMetrics(contractId);
    return NextResponse.json({
      data: {
        externalUrl: canonical,
        mediaIdResolved: Boolean(resolvedMediaId),
        sync,
        note:
          sync?.source === "INSTAGRAM_GRAPH_UNAVAILABLE"
            ? "Instagram Graph was unavailable for now. We saved your reel and kept the last known metric."
            : undefined
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

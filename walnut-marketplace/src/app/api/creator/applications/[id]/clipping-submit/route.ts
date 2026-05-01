import { ClippingLifecycleStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireConnectedCreator } from "@/lib/creator-access";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

type Payload = {
  stage?: "SAMPLE" | "FINAL";
  url?: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { creatorProfileId } = await requireConnectedCreator(req);
    const { id } = await params;
    const body = (await req.json()) as Payload;
    const stage = body.stage;
    const url = (body.url ?? "").trim();
    if (!stage || (stage !== "SAMPLE" && stage !== "FINAL")) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    if (!url) return NextResponse.json({ error: "Submission URL is required" }, { status: 400 });

    const app = await db.application.findUnique({
      where: { id },
      include: { creator: true, requirement: true }
    });
    if (!app || app.creatorId !== creatorProfileId) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (app.requirement.category !== "CLIPPING") {
      return NextResponse.json({ error: "Not a clipping application" }, { status: 400 });
    }

    const normalizedConnected = (app.creator.instagramUsername ?? app.creator.instagramHandle ?? "")
      .replace(/^@/, "")
      .toLowerCase();
    const normalizedDestination = (app.clippingDestinationHandle ?? "").replace(/^@/, "").toLowerCase();
    if (!normalizedConnected || !normalizedDestination || normalizedConnected !== normalizedDestination) {
      return NextResponse.json(
        { error: "Connected Instagram account does not match clipping destination handle" },
        { status: 400 }
      );
    }

    const next =
      stage === "SAMPLE"
        ? {
            clippingSampleUrl: url,
            clippingLifecycleStatus: ClippingLifecycleStatus.SAMPLE_SUBMITTED
          }
        : {
            clippingFinalUrl: url,
            clippingLifecycleStatus: ClippingLifecycleStatus.PUBLISHED_ON_EDITOR_IG
          };
    const updated = await db.application.update({
      where: { id: app.id },
      data: next
    });
    await trackEvent(app.creator.userId, stage === "SAMPLE" ? "CLIPPING_SAMPLE_SUBMITTED" : "CLIPPING_FINAL_SUBMITTED", {
      applicationId: app.id,
      requirementId: app.requirementId
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

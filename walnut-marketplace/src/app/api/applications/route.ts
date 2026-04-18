import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isEligible } from "@/lib/eligibility";
import { applicationSchema } from "@/lib/validation";
import { requireConnectedCreator } from "@/lib/creator-access";
import { hashConsentPayload } from "@/lib/consent-hash";

const TERMS_VERSION = "2026-04-18";
const BARTER_CONSENT_VERSION = "2026-04-18";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireConnectedCreator(req);
    const payload = applicationSchema.parse(await req.json());

    const creator = await db.creatorProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });

    const requirement = await db.requirement.findUnique({
      where: { id: payload.requirementId },
      include: { eligibility: true, compensation: true }
    });
    if (!requirement || !requirement.eligibility) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }
    if (requirement.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Requirement is not open for applications" }, { status: 400 });
    }

    const hasBarter = requirement.compensation?.hasBarter === true;
    if (hasBarter && !payload.barterAccessAcknowledged) {
      return NextResponse.json(
        { error: "Barter deals require acknowledgment of limited access / handoff terms" },
        { status: 400 }
      );
    }

    const eligible = isEligible(requirement.eligibility, {
      gender: creator.gender,
      followerCount: creator.followerCount,
      avgEngagement: creator.avgEngagement,
      location: creator.city,
      niches: creator.niches
    });
    if (!eligible) {
      return NextResponse.json({ error: "Profile does not match eligibility filters" }, { status: 400 });
    }

    const existingApplication = await db.application.findFirst({
      where: {
        requirementId: requirement.id,
        creatorId: creator.id
      }
    });
    if (existingApplication) {
      return NextResponse.json({ error: "Already applied to this requirement" }, { status: 409 });
    }

    const now = new Date();
    const termsHash = hashConsentPayload({
      requirementId: requirement.id,
      version: payload.termsVersion ?? TERMS_VERSION
    });
    const barterHash = hasBarter
      ? hashConsentPayload({
          requirementId: requirement.id,
          version: payload.barterConsentVersion ?? BARTER_CONSENT_VERSION
        })
      : null;

    const application = await db.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          requirementId: requirement.id,
          creatorId: creator.id,
          pitch: payload.pitch,
          termsVersion: payload.termsVersion ?? TERMS_VERSION,
          termsAcceptedAt: now,
          barterConsentAt: hasBarter ? now : null,
          barterConsentVersion: hasBarter ? payload.barterConsentVersion ?? BARTER_CONSENT_VERSION : null
        }
      });

      await tx.consentRecord.create({
        data: {
          userId: user.userId,
          kind: "TERMS_APPLY",
          entityType: "Requirement",
          entityId: requirement.id,
          payloadHash: termsHash,
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
          userAgent: req.headers.get("user-agent") ?? undefined
        }
      });

      if (hasBarter && barterHash) {
        await tx.consentRecord.create({
          data: {
            userId: user.userId,
            kind: "BARTER_ACCESS",
            entityType: "Requirement",
            entityId: requirement.id,
            payloadHash: barterHash,
            ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
            userAgent: req.headers.get("user-agent") ?? undefined
          }
        });
      }

      return app;
    });

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

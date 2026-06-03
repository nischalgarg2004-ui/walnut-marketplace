import { NextRequest, NextResponse } from "next/server";
import { ClippingLifecycleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { isEligible } from "@/lib/eligibility";
import { applicationBodySchema, barterShippingSchema } from "@/lib/validation";
import { requireConnectedCreator } from "@/lib/creator-access";
import { hashConsentPayload } from "@/lib/consent-hash";
import { trackEvent } from "@/lib/analytics";

const TERMS_VERSION = "2026-04-18";
const BARTER_CONSENT_VERSION = "2026-04-18";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireConnectedCreator(req);
    const raw = await req.json();
    const payload = applicationBodySchema.parse(raw);

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

    const normalizedConnectedHandle = (creator.instagramUsername ?? creator.instagramHandle ?? "")
      .replace(/^@/, "")
      .trim()
      .toLowerCase();
    if (requirement.category === "CLIPPING") {
      const requestedHandle = (payload.clippingDestinationHandle ?? "")
        .replace(/^@/, "")
        .trim()
        .toLowerCase();
      if (!normalizedConnectedHandle) {
        return NextResponse.json(
          { error: "Connect Instagram before applying to clipping campaigns" },
          { status: 400 }
        );
      }
      if (!requestedHandle) {
        return NextResponse.json(
          { error: "Destination Instagram handle is required for clipping applications" },
          { status: 400 }
        );
      }
      if (requestedHandle !== normalizedConnectedHandle) {
        return NextResponse.json(
          {
            error:
              "Destination handle must match your connected Instagram account for clipping campaigns"
          },
          { status: 400 }
        );
      }
    }

    const hasBarter = requirement.compensation?.hasBarter === true;
    if (hasBarter && !payload.barterAccessAcknowledged) {
      return NextResponse.json(
        { error: "Barter deals require acknowledgment of limited access / handoff terms" },
        { status: 400 }
      );
    }

    if (hasBarter) {
      if (!payload.shipping) {
        return NextResponse.json(
          { error: "Shipping address is required for product / barter campaigns" },
          { status: 400 }
        );
      }
      barterShippingSchema.parse(payload.shipping);
    }

    const districtFilter =
      hasBarter && (requirement.eligibility.allowedDistrictIds?.length ?? 0) > 0;
    if (districtFilter && !creator.indiaDistrictId) {
      return NextResponse.json(
        {
          error:
            "This campaign is limited to selected districts. Add your state and district on your profile, then try again."
        },
        { status: 400 }
      );
    }

    const eligible = isEligible(
      {
        ...requirement.eligibility,
        allowedDistrictIds: requirement.eligibility.allowedDistrictIds ?? []
      },
      {
        gender: creator.gender,
        followerCount: creator.followerCount,
        avgEngagement: creator.avgEngagement,
        location: creator.city,
        niches: creator.niches,
        indiaDistrictId: creator.indiaDistrictId
      },
      { hasBarter }
    );
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

    const shipping = hasBarter && payload.shipping ? payload.shipping : null;

    const application = await db.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          requirementId: requirement.id,
          creatorId: creator.id,
          pitch: payload.pitch,
          termsVersion: payload.termsVersion ?? TERMS_VERSION,
          termsAcceptedAt: now,
          barterConsentAt: hasBarter ? now : null,
          barterConsentVersion: hasBarter ? payload.barterConsentVersion ?? BARTER_CONSENT_VERSION : null,
          shippingFullName: shipping?.shippingFullName ?? null,
          shippingPhone: shipping?.shippingPhone ?? null,
          shippingLine1: shipping?.shippingLine1 ?? null,
          shippingLine2: shipping?.shippingLine2 ?? null,
          shippingCity: shipping?.shippingCity ?? null,
          shippingState: shipping?.shippingState ?? null,
          shippingPincode: shipping?.shippingPincode ?? null,
          addressSharedWithBrandAt: shipping ? now : null,
          clippingDestinationHandle:
            requirement.category === "CLIPPING"
              ? (payload.clippingDestinationHandle ?? "")
                  .replace(/^@/, "")
                  .trim()
                  .toLowerCase()
              : null,
          clippingLifecycleStatus:
            requirement.category === "CLIPPING"
              ? ClippingLifecycleStatus.SOURCE_RECEIVED
              : null
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

    if (requirement.category === "CLIPPING") {
      await trackEvent(user.userId, "CLIPPING_APPLICATION_CREATED", {
        requirementId: requirement.id,
        applicationId: application.id,
        destinationHandle: application.clippingDestinationHandle
      });
    }

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : message === "INSTAGRAM_NOT_CONNECTED" ? 412 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

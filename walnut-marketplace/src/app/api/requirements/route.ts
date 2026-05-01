import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeRequirementPayload, requirementSchema } from "@/lib/validation";

export async function GET() {
  const requirements = await db.requirement.findMany({
    where: { status: "PUBLISHED" },
    include: {
      eligibility: true,
      compensation: true
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ data: requirements });
}

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const body = await req.json();
    const parsed = requirementSchema.parse(body);
    const payload = normalizeRequirementPayload(parsed);

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) return NextResponse.json({ error: "Business profile not found" }, { status: 400 });

    const created = await db.requirement.create({
      data: {
        businessId: business.id,
        title: payload.title,
        brief: payload.brief,
        platforms: payload.platforms,
        contentType: payload.contentType,
        category: payload.category,
        clippingMeta: payload.clippingMeta ? (payload.clippingMeta as object) : undefined,
        deliverableCount: payload.deliverableCount ?? 1,
        deliverableKind: payload.deliverableKind ?? undefined,
        deliverableSlots: payload.deliverableSlots
          ? (payload.deliverableSlots as object)
          : undefined,
        applicationDeadline: payload.applicationDeadline
          ? new Date(payload.applicationDeadline)
          : null,
        deliveryDueAt: payload.deliveryDueAt ? new Date(payload.deliveryDueAt) : null,
        deliveryDueOffsetDays: payload.deliveryDueOffsetDays ?? null,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        postText: payload.postText,
        postImageUrl: payload.postImageUrl ?? null,
        postPublishedAt: payload.status === "PUBLISHED" ? new Date() : null,
        status: payload.status,
        eligibility: {
          create: {
            genderAllowed: payload.eligibility.genderAllowed,
            minFollowers: payload.eligibility.minFollowers,
            minEngagementRate: payload.eligibility.minEngagementRate ?? null,
            allowedLocations: payload.eligibility.allowedLocations,
            allowedDistrictIds: payload.eligibility.allowedDistrictIds,
            niches: payload.eligibility.niches
          }
        },
        compensation: {
          create: payload.compensation
        }
      },
      include: { eligibility: true, compensation: true }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

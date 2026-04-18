import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirementSchema } from "@/lib/validation";

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
    const payload = requirementSchema.parse(body);

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
        deliverableCount: payload.deliverableCount,
        deliverableKind: payload.deliverableKind ?? undefined,
        applicationDeadline: payload.applicationDeadline
          ? new Date(payload.applicationDeadline)
          : null,
        deliveryDueAt: payload.deliveryDueAt ? new Date(payload.deliveryDueAt) : null,
        deliveryDueOffsetDays: payload.deliveryDueOffsetDays ?? null,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        status: payload.status,
        eligibility: {
          create: payload.eligibility
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

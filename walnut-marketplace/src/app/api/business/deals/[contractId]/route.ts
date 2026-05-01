import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ contractId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { contractId } = await params;

    const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
    if (!business && user.role === UserRole.BUSINESS) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const contract = await db.contract.findFirst({
      where:
        user.role === UserRole.ADMIN
          ? { id: contractId }
          : { id: contractId, businessId: business!.id },
      include: {
        requirement: {
          include: { compensation: true, business: { select: { brandName: true } } }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            instagramUsername: true,
            instagramHandle: true,
            followerCount: true
          }
        },
        deliverables: { orderBy: [{ slotIndex: "asc" }, { submittedAt: "asc" }] },
        barterShipment: true,
        performanceReport: true,
        metricSnapshots: { orderBy: { capturedAt: "desc" }, take: 10 },
        payouts: { orderBy: { releasedAt: "desc" }, take: 5 },
        application: true
      }
    });
    if (!contract) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contract });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


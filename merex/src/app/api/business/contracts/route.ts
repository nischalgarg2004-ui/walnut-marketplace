import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const contracts = await db.contract.findMany({
      where: { businessId: business.id },
      include: {
        requirement: { select: { title: true } },
        creator: { select: { fullName: true } },
        performanceReport: { select: { viewsCount: true, status: true, source: true } }
      },
      orderBy: { acceptedAt: "desc" }
    });

    return NextResponse.json({ data: contracts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    const role = user.role;

    if (role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business) return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
      const totalRequirements = await db.requirement.count({ where: { businessId: business.id } });
      const totalApplications = await db.application.count({
        where: { requirement: { businessId: business.id } }
      });
      return NextResponse.json({ data: { totalRequirements, totalApplications } });
    }

    if (role === UserRole.CREATOR) {
      const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
      if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });
      const totalApplications = await db.application.count({ where: { creatorId: creator.id } });
      const approvedApplications = await db.application.count({
        where: { creatorId: creator.id, status: "APPROVED" }
      });
      return NextResponse.json({ data: { totalApplications, approvedApplications } });
    }

    requireRole(user, [UserRole.ADMIN]);
    const [users, requirements, payouts] = await Promise.all([
      db.user.count(),
      db.requirement.count(),
      db.payout.count()
    ]);
    return NextResponse.json({ data: { users, requirements, payouts } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

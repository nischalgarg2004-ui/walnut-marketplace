import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const requirements = await db.requirement.findMany({
      where: { status: "PUBLISHED" },
      include: {
        business: true,
        applications: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json({ data: requirements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

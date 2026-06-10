import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const actor = getRequiredSessionUser(req);
    requireRole(actor, [UserRole.ADMIN]);

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const status = req.nextUrl.searchParams.get("status")?.trim() ?? "";

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { instagramUsername: { contains: q, mode: "insensitive" } }
      ];
    }

    const requests = await db.earlyAccessRequest.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        name: r.name,
        mobileNumber: r.mobileNumber,
        instagramUsername: r.instagramUsername,
        roleType: r.roleType,
        status: r.status,
        createdAt: r.createdAt.toISOString()
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

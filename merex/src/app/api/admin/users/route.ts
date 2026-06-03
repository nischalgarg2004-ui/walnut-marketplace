import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const modeRaw = req.nextUrl.searchParams.get("mode")?.trim().toLowerCase() ?? "";
    const mode: "creator" | "business" | null =
      modeRaw === "creator" ? "creator" : modeRaw === "business" ? "business" : null;

    const pageSize = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "50") || 50));
    let page = Math.max(1, Math.floor(Number(req.nextUrl.searchParams.get("page") ?? "1") || 1));

    const roleFilter =
      mode === "creator" ? { role: UserRole.CREATOR } : mode === "business" ? { role: UserRole.BUSINESS } : {};

    const emailFilter = q.length > 0 ? { email: { contains: q, mode: "insensitive" as const } } : {};

    const where =
      Object.keys(roleFilter).length || Object.keys(emailFilter).length
        ? { ...roleFilter, ...emailFilter }
        : undefined;

    const total = await db.user.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(page, totalPages);

    const skip = (page - 1) * pageSize;

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        creatorProfile: { select: { id: true, fullName: true, kycStatus: true, instagramUsername: true } },
        businessProfile: { select: { id: true, brandName: true, verificationStatus: true } }
      }
    });

    return NextResponse.json({
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        creatorProfile: u.creatorProfile,
        businessProfile: u.businessProfile
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

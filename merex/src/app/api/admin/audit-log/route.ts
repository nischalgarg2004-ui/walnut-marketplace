import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const cursor = req.nextUrl.searchParams.get("cursor")?.trim();
    const take = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "50") || 50));

    const rows = await db.auditLog.findMany({
      take: take + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor }
          }
        : {}),
      include: {
        actor: { select: { id: true, email: true, role: true } }
      }
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return NextResponse.json({
      data: page.map((r) => ({
        id: r.id,
        actorUserId: r.actorUserId,
        actorEmail: r.actor.email,
        actorRole: r.actor.role,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString()
      })),
      meta: { nextCursor }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

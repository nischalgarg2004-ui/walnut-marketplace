import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/activity-log";
import { db } from "@/lib/db";

const flagSchema = z.object({
  entityType: z.string().min(2),
  entityId: z.string().min(5),
  reason: z.string().min(5)
});

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const take = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "100") || 100));

    const flags = await db.adminFlag.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take
    });

    return NextResponse.json({ data: flags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);
    const payload = flagSchema.parse(await req.json());

    const flag = await db.adminFlag.create({
      data: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        reason: payload.reason,
        assignedAdminId: user.userId
      }
    });

    await writeAudit({
      actorUserId: user.userId,
      entityType: "ADMIN_FLAG",
      entityId: flag.id,
      action: "FLAG_CREATE",
      metadata: { entityType: payload.entityType, entityId: payload.entityId, reason: payload.reason }
    });

    return NextResponse.json({ data: flag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

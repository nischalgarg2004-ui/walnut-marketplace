import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const flagSchema = z.object({
  entityType: z.string().min(2),
  entityId: z.string().min(5),
  reason: z.string().min(5)
});

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

    return NextResponse.json({ data: flag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/activity-log";
import { db } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"])
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const existing = await db.adminFlag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    const updated = await db.adminFlag.update({
      where: { id },
      data: {
        status: body.status,
        assignedAdminId: existing.assignedAdminId ?? user.userId
      }
    });

    await writeAudit({
      actorUserId: user.userId,
      entityType: "ADMIN_FLAG",
      entityId: id,
      action: `FLAG_${body.status}`,
      metadata: { previousStatus: existing.status }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

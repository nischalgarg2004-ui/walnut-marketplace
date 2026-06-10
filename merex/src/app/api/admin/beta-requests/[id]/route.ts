import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/activity-log";
import { db } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["PENDING", "GRANTED", "REJECTED"])
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = getRequiredSessionUser(req);
    requireRole(actor, [UserRole.ADMIN]);

    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const target = await db.earlyAccessRequest.findUnique({
      where: { id }
    });

    if (!target) {
      return NextResponse.json({ error: "Early access request not found" }, { status: 404 });
    }

    const updated = await db.earlyAccessRequest.update({
      where: { id },
      data: { status: body.status }
    });

    await writeAudit({
      actorUserId: actor.userId,
      entityType: "EARLY_ACCESS_REQUEST",
      entityId: id,
      action: `EARLY_ACCESS_STATUS_${body.status}`,
      metadata: {
        name: target.name,
        instagramUsername: target.instagramUsername,
        previousStatus: target.status
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const actor = getRequiredSessionUser(req);
    requireRole(actor, [UserRole.ADMIN]);

    const { id } = await params;

    const target = await db.earlyAccessRequest.findUnique({
      where: { id }
    });

    if (!target) {
      return NextResponse.json({ error: "Early access request not found" }, { status: 404 });
    }

    await db.earlyAccessRequest.delete({
      where: { id }
    });

    await writeAudit({
      actorUserId: actor.userId,
      entityType: "EARLY_ACCESS_REQUEST",
      entityId: id,
      action: "EARLY_ACCESS_DELETE",
      metadata: {
        name: target.name,
        instagramUsername: target.instagramUsername,
        status: target.status
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

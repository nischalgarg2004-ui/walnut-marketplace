import { PayoutStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/activity-log";
import { db } from "@/lib/db";

const reconcileSchema = z.object({
  action: z.enum(["RETRY", "HOLD", "RELEASE"]),
  note: z.string().max(1000).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);
    const { id } = await params;
    const payload = reconcileSchema.parse(await req.json());

    const status: PayoutStatus =
      payload.action === "RETRY"
        ? PayoutStatus.PROCESSING
        : payload.action === "RELEASE"
          ? PayoutStatus.PAID
          : PayoutStatus.PENDING;

    const payout = await db.payout.update({
      where: { id },
      data: {
        status,
        releasedAt: payload.action === "RELEASE" ? new Date() : null
      }
    });

    await writeAudit({
      actorUserId: user.userId,
      entityType: "PAYOUT",
      entityId: id,
      action: `RECONCILE_${payload.action}`,
      metadata: { note: payload.note ?? null, status }
    });

    return NextResponse.json({ data: payout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

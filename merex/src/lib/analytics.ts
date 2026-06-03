import type { Prisma } from "@prisma/client";
import { db } from "./db";

export async function trackEvent(userId: string | null, event: string, metadata?: Record<string, unknown>) {
  if (!userId) return;
  await db.auditLog.create({
    data: {
      actorUserId: userId,
      entityType: "EVENT",
      entityId: event,
      action: "TRACK",
      metadata: (metadata ?? {}) as Prisma.InputJsonValue
    }
  });
}

import { db } from "@/lib/db";

export async function writeAudit(params: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: unknown;
}) {
  await db.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      metadata: params.metadata === undefined ? undefined : (params.metadata as object)
    }
  });
}

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
}) {
  await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body
    }
  });
}


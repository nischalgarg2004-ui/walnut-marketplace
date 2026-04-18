import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";

export async function requireConnectedCreator(req: NextRequest) {
  const user = getRequiredSessionUser(req);
  requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
  const profile = await db.creatorProfile.findUnique({
    where: { userId: user.userId },
    select: { id: true, instagramConnectedAt: true }
  });
  if (!profile) {
    throw new Error("Creator profile not found");
  }
  if (!profile.instagramConnectedAt) {
    throw new Error("INSTAGRAM_NOT_CONNECTED");
  }
  return { user, creatorProfileId: profile.id };
}

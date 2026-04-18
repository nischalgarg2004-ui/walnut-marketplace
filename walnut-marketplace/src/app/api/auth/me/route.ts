import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const creatorProfile = user.role === "CREATOR"
    ? await db.creatorProfile.findUnique({
        where: { userId: user.userId },
        select: { instagramConnectedAt: true, instagramUsername: true }
      })
    : null;
  return NextResponse.json({
    data: {
      ...user,
      instagramConnected: Boolean(creatorProfile?.instagramConnectedAt),
      instagramUsername: creatorProfile?.instagramUsername ?? null
    }
  });
}

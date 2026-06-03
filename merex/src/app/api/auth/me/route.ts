import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creatorProfileNeedsOnboarding } from "@/lib/creator-profile-completeness";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.userId },
    select: { status: true }
  });
  if (!dbUser || dbUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "ACCOUNT_SUSPENDED" }, { status: 403 });
  }

  const creatorProfile = user.role === "CREATOR"
    ? await db.creatorProfile.findUnique({
        where: { userId: user.userId },
        select: {
          instagramConnectedAt: true,
          instagramUsername: true,
          fullName: true,
          niches: true,
          instagramProfilePictureUrl: true
        }
      })
    : null;
  const onboardingRequired = creatorProfile ? creatorProfileNeedsOnboarding(creatorProfile) : false;
  return NextResponse.json({
    data: {
      ...user,
      instagramConnected: Boolean(creatorProfile?.instagramConnectedAt),
      instagramUsername: creatorProfile?.instagramUsername ?? null,
      onboardingRequired
    }
  });
}

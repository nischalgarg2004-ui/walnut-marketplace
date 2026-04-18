import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptTokenFromStorage, fetchInstagramExtendedFields } from "@/lib/integrations/instagram";

/**
 * Refreshes follower count, post (media) count, and display name from Instagram Graph API
 * using the stored OAuth token for the connected Professional account.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const profile = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!profile?.instagramAccessTokenEncrypted) {
      return NextResponse.json({ error: "Connect Instagram first" }, { status: 400 });
    }
    const token = decryptTokenFromStorage(profile.instagramAccessTokenEncrypted);
    if (!token) {
      return NextResponse.json({ error: "Reconnect Instagram to refresh your token" }, { status: 400 });
    }
    const extended = await fetchInstagramExtendedFields(token);
    const hasName = Boolean(extended.profileName?.trim());
    const hasFollowers = extended.followersCount !== undefined;
    const hasMedia = extended.mediaCount !== undefined;
    if (!hasName && !hasFollowers && !hasMedia) {
      return NextResponse.json(
        {
          error:
            "Instagram did not return profile stats. Ensure the app has the right permissions and try reconnecting Instagram."
        },
        { status: 502 }
      );
    }
    const updated = await db.creatorProfile.update({
      where: { userId: user.userId },
      data: {
        ...(hasFollowers ? { followerCount: extended.followersCount! } : {}),
        ...(hasMedia ? { postCount: extended.mediaCount! } : {}),
        ...(hasName ? { fullName: extended.profileName!.trim() } : {}),
        instagramHandle: profile.instagramUsername ?? profile.instagramHandle,
        instagramStatsSyncedAt: new Date()
      }
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchInstagramPublicProfile } from "@/lib/integrations/instagram-public-profile";

/**
 * Refreshes display name, follower count, post count, and profile photo URL by reading the
 * public Instagram web profile for the connected username (no Graph API).
 */
export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const profile = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const raw = profile.instagramUsername ?? profile.instagramHandle;
    const username = raw?.replace(/^@/, "").trim();
    if (!username) {
      return NextResponse.json(
        { error: "Connect Instagram or add an Instagram username to sync." },
        { status: 400 }
      );
    }

    let extracted;
    try {
      extracted = await fetchInstagramPublicProfile(username);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load Instagram profile";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const hasName = Boolean(extracted.fullName?.trim());
    const hasFollowers = extracted.followersCount !== undefined;
    const hasMedia = extracted.mediaCount !== undefined;
    const hasPic = Boolean(extracted.profilePictureUrl?.trim());

    if (!hasName && !hasFollowers && !hasMedia && !hasPic) {
      return NextResponse.json(
        { error: "Instagram did not return usable profile data. Try again later or check the account is public." },
        { status: 502 }
      );
    }

    const updated = await db.creatorProfile.update({
      where: { userId: user.userId },
      data: {
        ...(hasFollowers ? { followerCount: extracted.followersCount! } : {}),
        ...(hasMedia ? { postCount: extracted.mediaCount! } : {}),
        ...(hasName ? { fullName: extracted.fullName!.trim() } : {}),
        ...(hasPic ? { instagramProfilePictureUrl: extracted.profilePictureUrl!.trim() } : {}),
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

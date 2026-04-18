import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  decodeInstagramState,
  encryptTokenForStorage,
  exchangeCodeForAccessToken,
  fetchInstagramIdentity
} from "@/lib/integrations/instagram";
import { fetchInstagramPublicProfile } from "@/lib/integrations/instagram-public-profile";
import { createSessionToken, getSessionUser, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";

function syntheticEmail(igUserId: string) {
  return `ig_${igUserId}@instagram.local`;
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    if (!code || !stateRaw) {
      return NextResponse.redirect(new URL("/login?error=instagram_missing_code", req.nextUrl.origin));
    }
    let state;
    try {
      state = decodeInstagramState(stateRaw);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_invalid_state", req.nextUrl.origin));
    }
    const nonceCookie = req.cookies.get("instagram_oauth_nonce")?.value;
    if (!nonceCookie || nonceCookie !== state.nonce) {
      return NextResponse.redirect(new URL("/login?error=instagram_state_mismatch", req.nextUrl.origin));
    }

    let accessToken: string;
    try {
      accessToken = await exchangeCodeForAccessToken(code);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_code_exchange_failed", req.nextUrl.origin));
    }

    let identity;
    try {
      identity = await fetchInstagramIdentity(accessToken);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_profile_fetch_failed", req.nextUrl.origin));
    }
    let webProfile: Awaited<ReturnType<typeof fetchInstagramPublicProfile>> | null = null;
    try {
      webProfile = await fetchInstagramPublicProfile(identity.username);
    } catch {
      webProfile = null;
    }
    const displayName = webProfile?.fullName?.trim() || identity.username;
    const encryptedToken = encryptTokenForStorage(accessToken);
    const existingSession = getSessionUser(req);
    const linkedProfile = await db.creatorProfile.findUnique({
      where: { instagramUserId: identity.userId },
      include: { user: true }
    });

    let userId: string;
    if (state.mode === "connect") {
      if (!existingSession || existingSession.role !== UserRole.CREATOR) {
        return NextResponse.redirect(new URL("/login?error=connect_requires_login", req.nextUrl.origin));
      }
      userId = existingSession.userId;
    } else if (linkedProfile?.user) {
      userId = linkedProfile.user.id;
    } else {
      const email = state.email ?? syntheticEmail(identity.userId);
      const createdUser = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: UserRole.CREATOR,
          creatorProfile: {
            create: {
              fullName: displayName,
              niches: [],
              ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
              ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
              ...(webProfile?.profilePictureUrl?.trim()
                ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
                : {}),
              ...(webProfile?.followersCount !== undefined ||
              webProfile?.mediaCount !== undefined ||
              webProfile?.fullName?.trim() ||
              webProfile?.profilePictureUrl?.trim()
                ? { instagramStatsSyncedAt: new Date() }
                : {})
            }
          }
        }
      });
      userId = createdUser.id;
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found after Instagram callback");
    }

    await db.creatorProfile.upsert({
      where: { userId: user.id },
      update: {
        instagramUserId: identity.userId,
        instagramUsername: identity.username,
        instagramHandle: identity.username,
        instagramAccountType: identity.accountType,
        instagramConnectedAt: new Date(),
        instagramAccessTokenEncrypted: encryptedToken,
        ...(webProfile?.fullName?.trim() ? { fullName: webProfile.fullName.trim() } : {}),
        ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
        ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
        ...(webProfile?.profilePictureUrl?.trim()
          ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
          : {}),
        ...(webProfile?.followersCount !== undefined ||
        webProfile?.mediaCount !== undefined ||
        webProfile?.fullName?.trim() ||
        webProfile?.profilePictureUrl?.trim()
          ? { instagramStatsSyncedAt: new Date() }
          : {})
      },
      create: {
        userId: user.id,
        fullName: displayName,
        niches: [],
        instagramUserId: identity.userId,
        instagramUsername: identity.username,
        instagramHandle: identity.username,
        instagramAccountType: identity.accountType,
        instagramConnectedAt: new Date(),
        instagramAccessTokenEncrypted: encryptedToken,
        ...(webProfile?.followersCount !== undefined ? { followerCount: webProfile.followersCount } : {}),
        ...(webProfile?.mediaCount !== undefined ? { postCount: webProfile.mediaCount } : {}),
        ...(webProfile?.profilePictureUrl?.trim()
          ? { instagramProfilePictureUrl: webProfile.profilePictureUrl.trim() }
          : {}),
        ...(webProfile?.followersCount !== undefined ||
        webProfile?.mediaCount !== undefined ||
        webProfile?.profilePictureUrl?.trim()
          ? { instagramStatsSyncedAt: new Date() }
          : {})
      }
    });

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });
    const nextPath = user.passwordHash ? "/creator/dashboard" : "/creator/settings?completePassword=1";
    const response = NextResponse.redirect(new URL(nextPath, req.nextUrl.origin));
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieSecure(req),
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    response.cookies.set("instagram_oauth_nonce", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return response;
  } catch (error) {
    console.error("[instagram/callback]", error);
    return NextResponse.redirect(new URL("/login?error=instagram_callback_failed", req.nextUrl.origin));
  }
}

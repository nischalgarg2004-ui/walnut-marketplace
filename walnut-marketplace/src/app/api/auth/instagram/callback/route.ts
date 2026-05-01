import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildTokenExpiryDate,
  decodeInstagramState,
  encryptTokenForStorage,
  exchangeForLongLivedAccessToken,
  exchangeCodeForAccessToken,
  fetchInstagramIdentity
} from "@/lib/integrations/instagram";
import { fetchInstagramProfileForSync } from "@/lib/integrations/instagram-public-profile";
import { createSessionToken, getSessionUser, SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth";
import { verifyLinkVerificationToken } from "@/lib/otp";
import { getRequestOrigin } from "@/lib/request-origin";

function syntheticEmail(igUserId: string) {
  return `ig_${igUserId}@instagram.local`;
}

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);
  try {
    const code = req.nextUrl.searchParams.get("code");
    const stateRaw = req.nextUrl.searchParams.get("state");
    if (!code || !stateRaw) {
      return NextResponse.redirect(new URL("/login?error=instagram_missing_code", origin));
    }
    let state;
    try {
      state = decodeInstagramState(stateRaw);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_invalid_state", origin));
    }
    const nonceCookie = req.cookies.get("instagram_oauth_nonce")?.value;
    if (!nonceCookie || nonceCookie !== state.nonce) {
      return NextResponse.redirect(new URL("/login?error=instagram_state_mismatch", origin));
    }

    let accessToken: string;
    let tokenExpiresAt: Date | null = null;
    try {
      const redirectUri = new URL("/api/auth/instagram/callback", origin).toString();
      const shortLived = await exchangeCodeForAccessToken({ code, redirectUri });
      const longLived = await exchangeForLongLivedAccessToken(shortLived);
      accessToken = longLived.accessToken;
      tokenExpiresAt = buildTokenExpiryDate(longLived.expiresInSeconds);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_code_exchange_failed", origin));
    }

    let identity;
    try {
      identity = await fetchInstagramIdentity(accessToken);
    } catch {
      return NextResponse.redirect(new URL("/login?error=instagram_profile_fetch_failed", origin));
    }
    let webProfile: Awaited<ReturnType<typeof fetchInstagramProfileForSync>> | null = null;
    try {
      webProfile = await fetchInstagramProfileForSync({
        username: identity.username,
        accessToken
      });
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
    const linkedBusinessProfile = await db.businessProfile.findUnique({
      where: { instagramUserId: identity.userId },
      include: { user: true }
    });
    const isBusinessFlow = state.role === "business";
    let isNewAccountFromOAuth = false;

    let userId: string;
    if (state.mode === "connect") {
      if (!existingSession) {
        return NextResponse.redirect(new URL("/login?error=connect_requires_login", origin));
      }
      if (isBusinessFlow) {
        if (existingSession.role !== UserRole.BUSINESS) {
          return NextResponse.redirect(new URL("/login/business?error=connect_requires_business_login", origin));
        }
        const verifiedToken = req.cookies.get("business_link_verified")?.value;
        if (!verifiedToken || !verifyLinkVerificationToken(verifiedToken, existingSession.userId)) {
          return NextResponse.redirect(new URL("/business/settings?error=otp_verification_required", origin));
        }
        if (linkedBusinessProfile?.user && linkedBusinessProfile.user.id !== existingSession.userId) {
          return NextResponse.redirect(new URL("/business/settings?error=instagram_already_linked", origin));
        }
      } else if (existingSession.role !== UserRole.CREATOR) {
        return NextResponse.redirect(new URL("/login?error=connect_requires_creator_login", origin));
      }
      userId = existingSession.userId;
    } else if (isBusinessFlow && linkedBusinessProfile?.user) {
      userId = linkedBusinessProfile.user.id;
    } else if (!isBusinessFlow && linkedProfile?.user) {
      userId = linkedProfile.user.id;
    } else {
      const email = isBusinessFlow ? syntheticEmail(identity.userId) : state.email ?? syntheticEmail(identity.userId);
      const existingByEmail = await db.user.findUnique({ where: { email }, select: { id: true } });
      const createdUser = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: isBusinessFlow ? UserRole.BUSINESS : UserRole.CREATOR,
          ...(isBusinessFlow
            ? {
                businessProfile: {
                  create: {
                    legalName: displayName,
                    brandName: displayName,
                    billingEmail: email,
                    representativeFullName: displayName
                  }
                }
              }
            : {
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
              })
        }
      });
      userId = createdUser.id;
      isNewAccountFromOAuth = !existingByEmail;
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found after Instagram callback");
    }

    if (!isBusinessFlow) {
      await db.creatorProfile.upsert({
        where: { userId: user.id },
        update: {
          instagramUserId: identity.userId,
          instagramUsername: identity.username,
          instagramHandle: identity.username,
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt,
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
          instagramTokenExpiresAt: tokenExpiresAt,
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
    } else {
      await db.businessProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(webProfile?.fullName?.trim() ? { brandName: webProfile.fullName.trim(), legalName: webProfile.fullName.trim() } : {}),
          instagramUserId: identity.userId,
          instagramUsername: identity.username,
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt
        },
        create: {
          userId: user.id,
          legalName: displayName,
          brandName: displayName,
          billingEmail: user.email,
          representativeFullName: displayName,
          instagramUserId: identity.userId,
          instagramUsername: identity.username,
          instagramAccountType: identity.accountType,
          instagramConnectedAt: new Date(),
          instagramAccessTokenEncrypted: encryptedToken,
          instagramTokenExpiresAt: tokenExpiresAt
        }
      });
    }

    const token = createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });
    const nextPath =
      user.role === UserRole.BUSINESS
        ? isNewAccountFromOAuth
          ? "/signup/business?from=instagram"
          : "/business/home"
        : isNewAccountFromOAuth
          ? "/signup/creator?from=instagram"
          : "/creator/dashboard";
    const response = NextResponse.redirect(new URL(nextPath, origin));
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
    response.cookies.set("business_link_verified", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return response;
  } catch (error) {
    console.error("[instagram/callback]", error);
    return NextResponse.redirect(new URL("/login?error=instagram_callback_failed", origin));
  }
}

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildInstagramAuthorizeUrlWithRedirectUri, encodeInstagramState } from "@/lib/integrations/instagram";
import { verifyLinkVerificationToken } from "@/lib/otp";
import { getRequestOrigin } from "@/lib/request-origin";

export async function GET(req: NextRequest) {
  try {
    const origin = getRequestOrigin(req);
    const modeRaw = req.nextUrl.searchParams.get("mode") ?? "login";
    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const roleRaw = req.nextUrl.searchParams.get("role") ?? undefined;
    const mode = modeRaw === "signup" || modeRaw === "connect" ? modeRaw : "login";
    const role = roleRaw === "business" ? "business" : roleRaw === "creator" ? "creator" : undefined;

    if (mode === "connect" && role === "business") {
      const user = getSessionUser(req);
      if (!user || user.role !== "BUSINESS") {
        return NextResponse.redirect(new URL("/login/business?error=connect_requires_login", origin));
      }
      const verifiedToken = req.cookies.get("business_link_verified")?.value;
      if (!verifiedToken || !verifyLinkVerificationToken(verifiedToken, user.userId)) {
        return NextResponse.redirect(new URL("/business/settings?error=otp_verification_required", origin));
      }
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const redirectUri = new URL("/api/auth/instagram/callback", origin).toString();
    const state = encodeInstagramState({ mode, email, role, nonce });
    const response = NextResponse.redirect(
      buildInstagramAuthorizeUrlWithRedirectUri({
        state,
        redirectUri
      })
    );
    response.cookies.set("instagram_oauth_nonce", nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Instagram auth";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

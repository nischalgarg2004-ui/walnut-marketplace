import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildInstagramAuthorizeUrl, encodeInstagramState } from "@/lib/integrations/instagram";

export async function GET(req: NextRequest) {
  try {
    const modeRaw = req.nextUrl.searchParams.get("mode") ?? "login";
    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const mode = modeRaw === "signup" || modeRaw === "connect" ? modeRaw : "login";
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = encodeInstagramState({ mode, email, nonce });
    const response = NextResponse.redirect(buildInstagramAuthorizeUrl(state));
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

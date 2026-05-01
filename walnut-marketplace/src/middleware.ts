import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Must match `SESSION_COOKIE_NAME` in `@/lib/auth` (kept inline here so Edge middleware does not import Node crypto). */
const WALNUT_SESSION = "walnut_session";

/** Presence-only check; full verification happens in route handlers and role layouts. */
export function middleware(req: NextRequest) {
  const token = req.cookies.get(WALNUT_SESSION)?.value;
  if (token) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  if (req.nextUrl.pathname.startsWith("/business")) {
    url.pathname = "/login/business";
  } else if (req.nextUrl.pathname.startsWith("/creator")) {
    url.pathname = "/login/creator";
  } else {
    url.pathname = "/login";
  }
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  /** Exact paths plus subtrees (some Next versions treat `:path*` as non-matching for the base segment alone). */
  matcher: [
    "/creator",
    "/creator/:path*",
    "/business",
    "/business/:path*",
    "/admin",
    "/admin/:path*"
  ]
};

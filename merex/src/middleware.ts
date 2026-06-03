import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  buildAbsoluteAdminPortalUrl,
  getConfiguredAdminHostname,
  isAdminHostname
} from "@/lib/admin-host";

/** Must match `SESSION_COOKIE_NAME` in `@/lib/auth` (kept inline here so Edge middleware does not import Node crypto). */
const MEREX_SESSION = "merex_session";

/** Presence-only check; full verification happens in route handlers and role layouts. */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const hostHeader =
    req.headers.get("x-forwarded-host")?.split(":")[0] ??
    req.headers.get("host")?.split(":")[0] ??
    "";
  const token = req.cookies.get(MEREX_SESSION)?.value;
  const adminConfigured = Boolean(getConfiguredAdminHostname());
  const onAdminHost = isAdminHostname(hostHeader);

  if (!onAdminHost) {
    if (adminConfigured && pathname.startsWith("/admin")) {
      return NextResponse.redirect(buildAbsoluteAdminPortalUrl(req, pathname, search));
    }

    const needsAuth =
      pathname.startsWith("/creator") || pathname.startsWith("/business") || pathname.startsWith("/admin");
    if (!needsAuth) {
      return NextResponse.next();
    }

    if (token) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    if (pathname.startsWith("/business")) {
      url.pathname = "/login/business";
    } else if (pathname.startsWith("/creator")) {
      url.pathname = "/login/creator";
    } else if (pathname.startsWith("/admin")) {
      url.pathname = "/login/admin";
    } else {
      url.pathname = "/login";
    }
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  // Dedicated admin hostname: only admin app + admin login + APIs.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (token) {
    if (pathname.startsWith("/login/admin")) {
      return NextResponse.next();
    }
    if (
      pathname === "/" ||
      (pathname.startsWith("/login") && !pathname.startsWith("/login/admin")) ||
      pathname.startsWith("/creator") ||
      pathname.startsWith("/business")
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login/admin")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login/admin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const loginUrl = new URL("/login/admin", req.url);
  if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/login/")) {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/login/:path*",
    "/admin",
    "/admin/:path*",
    "/business",
    "/business/:path*",
    "/creator",
    "/creator/:path*"
  ]
};

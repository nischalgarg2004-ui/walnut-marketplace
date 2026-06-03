import type { NextRequest } from "next/server";

export function getRequestOrigin(req: NextRequest): string {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = req.headers.get("host")?.split(",")[0]?.trim();
  if (host) {
    const proto = req.nextUrl.protocol.replace(":", "") || "https";
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

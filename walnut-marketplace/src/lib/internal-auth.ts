import { NextRequest } from "next/server";

export function verifyCronOrInternalSecret(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  const secret = process.env.CRON_SECRET ?? process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveContracts } from "@/lib/metrics-sync";
import { verifyCronOrInternalSecret } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  if (!verifyCronOrInternalSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = Math.min(200, Number(req.nextUrl.searchParams.get("limit") ?? "50") || 50);
  const result = await syncAllActiveContracts(limit);
  return NextResponse.json({ data: result });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

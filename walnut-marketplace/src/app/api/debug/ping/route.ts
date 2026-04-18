import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // #region agent log
  try {
    const entry = {
      sessionId: "d9df3a",
      location: "api/debug/ping/route.ts:GET",
      message: "debug_ping_hit",
      data: {
        host: req.headers.get("host"),
        userAgent: req.headers.get("user-agent"),
        url: req.nextUrl.href
      },
      timestamp: Date.now(),
      hypothesisId: "H10-H12"
    };
    const line = `${JSON.stringify(entry)}\n`;
    fs.appendFileSync(path.join(process.cwd(), "debug-d9df3a.log"), line, "utf8");
    fs.appendFileSync("d:\\debug-d9df3a.log", line, "utf8");
  } catch {
    /* ignore */
  }
  // #endregion
  return NextResponse.json({ ok: true, debugSession: "d9df3a" });
}

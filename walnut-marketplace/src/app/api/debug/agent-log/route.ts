import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

/** Same-origin relay so browser logs reach NDJSON file + ingest without CORS issues. Debug only. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let line = raw.trim();
  if (!line.startsWith("{")) line = JSON.stringify({ raw: line });
  const file = path.join(process.cwd(), "debug-d9df3a.log");
  try {
    fs.appendFileSync(file, `${line}\n`, "utf8");
  } catch {
    /* ignore */
  }
  fetch("http://127.0.0.1:7692/ingest/0242ad20-c2e6-410e-ad89-a39ea499ef87", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d9df3a" },
    body: line
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}

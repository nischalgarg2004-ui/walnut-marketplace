import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      app: "up",
      db: "up",
      now: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        app: "up",
        db: "down",
        now: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Signature verification should be added before production launch.
  const event = await req.json();
  const payoutId = event?.payload?.payout?.entity?.notes?.payoutId as string | undefined;
  const eventType = event?.event as string | undefined;

  if (!payoutId || !eventType) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (eventType.includes("processed")) {
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: "PAID",
        releasedAt: new Date(),
        payoutRef: event?.payload?.payout?.entity?.id
      }
    });
  } else if (eventType.includes("failed")) {
    await db.payout.update({
      where: { id: payoutId },
      data: { status: "FAILED" }
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (webhookSecret && featureFlags.razorpayWebhookVerify) {
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    const digest = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const match =
      digest.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
    if (!match) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }
  const event = JSON.parse(rawBody);
  const payoutId = event?.payload?.payout?.entity?.notes?.payoutId as string | undefined;
  const eventType = event?.event as string | undefined;

  if (!payoutId || !eventType) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (eventType.includes("processed")) {
    await db.payout.updateMany({
      where: { id: payoutId, status: { not: "PAID" } },
      data: {
        status: "PAID",
        releasedAt: new Date(),
        payoutRef: event?.payload?.payout?.entity?.id
      }
    });
  } else if (eventType.includes("failed")) {
    await db.payout.updateMany({
      where: { id: payoutId, status: { not: "PAID" } },
      data: { status: "FAILED" }
    });
  }

  return NextResponse.json({ ok: true });
}

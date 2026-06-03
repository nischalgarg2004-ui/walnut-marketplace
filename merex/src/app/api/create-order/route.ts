import { Prisma, UserRole, WalletTransactionStatus } from "@prisma/client";
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const bodySchema = z.object({
  amount: z.number().int().min(100).max(10_000_000_00),
  currency: z.string().min(3).max(3).default("INR")
});

function requireRazorpayEnv() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_NOT_CONFIGURED");
  }
  return { keyId, keySecret };
}

function toDecimalFromPaise(paise: number) {
  return new Prisma.Decimal((paise / 100).toFixed(2));
}

function buildReceipt(walletId: string) {
  // Razorpay receipt max length is 40 chars.
  const shortWallet = walletId.slice(-10);
  const shortTs = Date.now().toString().slice(-8);
  return `wt_${shortWallet}_${shortTs}`;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybe = error as { error?: { description?: string; reason?: string; code?: string } };
    const desc = maybe.error?.description || maybe.error?.reason || maybe.error?.code;
    if (desc) return desc;
  }
  return "Unable to create order";
}

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const payload = bodySchema.parse(await req.json());

    const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const wallet = await db.walletAccount.upsert({
      where: { businessId: business.id },
      update: {},
      create: { businessId: business.id }
    });

    const { keyId, keySecret } = requireRazorpayEnv();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const receipt = buildReceipt(wallet.id);
    const order = await razorpay.orders.create({
      amount: payload.amount,
      currency: payload.currency,
      receipt
    });

    // Create a PENDING wallet transaction. Wallet balance is credited only after signature verification.
    const tx = await db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "ADD_FUNDS",
        status: WalletTransactionStatus.PENDING,
        amount: toDecimalFromPaise(payload.amount),
        description: "Wallet top-up (Razorpay order created)",
        reference: order.id,
        metadata: {
          razorpayOrderId: order.id,
          receipt,
          currency: payload.currency,
          amountPaise: payload.amount
        }
      }
    });

    return NextResponse.json({
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: tx.id
      }
    });
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("RAZORPAY_CREATE_ORDER_FAILED", error);
    if (message === "RAZORPAY_NOT_CONFIGURED") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    if (message.toLowerCase().includes("authentication")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


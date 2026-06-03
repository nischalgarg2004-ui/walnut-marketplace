import { Prisma, UserRole, WalletTransactionStatus } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const bodySchema = z.object({
  razorpay_payment_id: z.string().min(5),
  razorpay_order_id: z.string().min(5),
  razorpay_signature: z.string().min(5)
});

function requireRazorpaySecret() {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_NOT_CONFIGURED");
  return secret;
}

function timingSafeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
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

    const tx = await db.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        type: "ADD_FUNDS",
        reference: payload.razorpay_order_id
      },
      orderBy: { createdAt: "desc" }
    });
    if (!tx) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    // Idempotency: if already completed, succeed without re-crediting.
    if (tx.status === WalletTransactionStatus.COMPLETED) {
      return NextResponse.json({ data: { verified: true, alreadyProcessed: true } });
    }
    if (tx.status !== WalletTransactionStatus.PENDING) {
      return NextResponse.json({ error: "ORDER_NOT_ELIGIBLE" }, { status: 400 });
    }

    const secret = requireRazorpaySecret();
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest("hex");

    const ok = timingSafeEqualHex(expected, payload.razorpay_signature);
    if (!ok) {
      await db.walletTransaction.update({
        where: { id: tx.id },
        data: {
          status: WalletTransactionStatus.FAILED,
          metadata: {
            ...(typeof tx.metadata === "object" && tx.metadata ? tx.metadata : {}),
            razorpayPaymentId: payload.razorpay_payment_id,
            signatureVerified: false
          }
        }
      });
      return NextResponse.json({ error: "SIGNATURE_MISMATCH" }, { status: 400 });
    }

    // Credit wallet only after verification, atomically with tx completion.
    const amount = tx.amount as unknown as Prisma.Decimal;
    const result = await db.$transaction(async (prisma) => {
      const updatedWallet = await prisma.walletAccount.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: amount }
        }
      });
      const updatedTx = await prisma.walletTransaction.update({
        where: { id: tx.id },
        data: {
          status: WalletTransactionStatus.COMPLETED,
          description: "Wallet top-up (Razorpay verified)",
          metadata: {
            ...(typeof tx.metadata === "object" && tx.metadata ? tx.metadata : {}),
            razorpayPaymentId: payload.razorpay_payment_id,
            signatureVerified: true
          }
        }
      });
      return { updatedWallet, updatedTx };
    });

    return NextResponse.json({
      data: {
        verified: true,
        availableBalance: Number(result.updatedWallet.availableBalance),
        reservedBalance: Number(result.updatedWallet.reservedBalance),
        transactionId: result.updatedTx.id
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment";
    if (message === "RAZORPAY_NOT_CONFIGURED") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


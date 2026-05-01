import { Prisma, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";

const bodySchema = z.object({
  amount: z.number().positive().max(10000000),
  paymentMethod: z.string().min(2).max(100)
});

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const payload = bodySchema.parse(await req.json());

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const wallet = await db.walletAccount.upsert({
      where: { businessId: business.id },
      update: {},
      create: {
        businessId: business.id
      }
    });

    const amount = toDecimal(payload.amount);
    const updatedWallet = await db.walletAccount.update({
      where: { id: wallet.id },
      data: {
        availableBalance: {
          increment: amount
        }
      }
    });

    const tx = await db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "ADD_FUNDS",
        status: "COMPLETED",
        amount,
        description: "Wallet top-up",
        reference: `TOPUP-${Date.now()}`,
        metadata: {
          paymentMethod: payload.paymentMethod
        }
      }
    });

    return NextResponse.json({
      data: {
        transactionId: tx.id,
        availableBalance: Number(updatedWallet.availableBalance),
        reservedBalance: Number(updatedWallet.reservedBalance)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add funds";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

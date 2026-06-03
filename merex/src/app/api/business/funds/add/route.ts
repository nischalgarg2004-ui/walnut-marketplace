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

    // Deprecated: legacy simulated top-up endpoint.
    // Use `/api/create-order` + `/api/verify-payment` (Razorpay Standard Checkout) instead.
    return NextResponse.json(
      {
        error: "DEPRECATED_USE_RAZORPAY_CHECKOUT",
        data: {
          amount: toDecimal(payload.amount),
          paymentMethod: payload.paymentMethod
        }
      },
      { status: 410 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add funds";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

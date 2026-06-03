import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";

function mask(value: string | undefined) {
  if (!value) return null;
  if (value.length <= 6) return `${value[0] ?? ""}***`;
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const serverKey = process.env.RAZORPAY_KEY_ID;
    const serverSecret = process.env.RAZORPAY_KEY_SECRET;

    return NextResponse.json({
      data: {
        nodeEnv: process.env.NODE_ENV ?? null,
        hasNextPublicRazorpayKey: Boolean(publicKey),
        hasServerRazorpayKey: Boolean(serverKey),
        hasServerRazorpaySecret: Boolean(serverSecret),
        nextPublicRazorpayKeyMasked: mask(publicKey),
        serverRazorpayKeyMasked: mask(serverKey)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


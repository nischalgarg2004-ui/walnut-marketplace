import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const businessProfileSchema = z.object({
  legalName: z.string().min(2),
  brandName: z.string().min(2),
  gstinPlaceholder: z.string().optional(),
  website: z.string().url().optional(),
  category: z.string().optional(),
  billingEmail: z.string().email().optional()
});

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const profile = await db.businessProfile.findUnique({ where: { userId: user.userId } });
    return NextResponse.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const payload = businessProfileSchema.parse(await req.json());
    const profile = await db.businessProfile.upsert({
      where: { userId: user.userId },
      update: payload,
      create: {
        userId: user.userId,
        ...payload
      }
    });
    return NextResponse.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

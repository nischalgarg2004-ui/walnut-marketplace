import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const businessProfileSchema = z.object({
  legalName: z.string().min(2),
  brandName: z.string().min(2),
  gstinPlaceholder: z.string().optional(),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  category: z.string().optional(),
  billingEmail: z.union([z.string().email(), z.literal("")]).optional(),
  representativeFullName: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.string().min(2).optional()),
  representativeDateOfBirth: z
    .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())
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
    const raw = businessProfileSchema.parse(await req.json());
    const payload = {
      legalName: raw.legalName,
      brandName: raw.brandName,
      gstinPlaceholder: raw.gstinPlaceholder,
      website: raw.website === "" ? undefined : raw.website,
      category: raw.category,
      billingEmail: raw.billingEmail === "" ? undefined : raw.billingEmail,
      representativeFullName: raw.representativeFullName ?? null,
      representativeDateOfBirth: raw.representativeDateOfBirth
        ? new Date(`${raw.representativeDateOfBirth}T12:00:00.000Z`)
        : null
    };
    const profile = await db.businessProfile.upsert({
      where: { userId: user.userId },
      update: payload,
      create: {
        userId: user.userId,
        legalName: payload.legalName,
        brandName: payload.brandName,
        gstinPlaceholder: payload.gstinPlaceholder,
        website: payload.website,
        category: payload.category,
        billingEmail: payload.billingEmail,
        representativeFullName: payload.representativeFullName,
        representativeDateOfBirth: payload.representativeDateOfBirth
      }
    });
    return NextResponse.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

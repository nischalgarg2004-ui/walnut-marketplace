import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CREATOR_NICHE_SLUG_SET } from "@/lib/creator-niches";

const creatorProfileSchema = z.object({
  fullName: z.string().min(2),
  bio: z.string().optional(),
  gender: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.union([z.enum(["male", "female", "other"]), z.null()]).optional()
  ),
  niches: z
    .array(z.string())
    .min(1)
    .max(5)
    .refine((arr) => new Set(arr).size === arr.length, "Duplicate niches")
    .refine((arr) => arr.every((s) => CREATOR_NICHE_SLUG_SET.has(s)), "Invalid niche"),
  city: z.string().optional(),
  state: z.string().optional(),
  instagramHandle: z.string().optional(),
  followerCount: z.number().int().min(0).default(0),
  postCount: z.number().int().min(0).default(0)
});

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const profile = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
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
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const payload = creatorProfileSchema.parse(await req.json());
    const existing = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    const { instagramHandle, ...rest } = payload;
    const data = {
      ...rest,
      ...(existing?.instagramConnectedAt
        ? {
            instagramHandle: existing.instagramUsername ?? existing.instagramHandle ?? null
          }
        : { instagramHandle: instagramHandle?.trim() ? instagramHandle.trim() : null })
    };
    const profile = await db.creatorProfile.upsert({
      where: { userId: user.userId },
      update: data,
      create: {
        userId: user.userId,
        ...data
      }
    });
    return NextResponse.json({ data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

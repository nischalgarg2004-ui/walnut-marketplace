import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const creatorProfileSchema = z.object({
  fullName: z.string().min(2),
  bio: z.string().optional(),
  gender: z.string().optional(),
  niches: z.array(z.string()).default([]),
  city: z.string().optional(),
  state: z.string().optional(),
  instagramHandle: z.string().optional(),
  followerCount: z.number().int().min(0).default(0),
  avgEngagement: z.number().min(0).default(0)
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
    const profile = await db.creatorProfile.upsert({
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

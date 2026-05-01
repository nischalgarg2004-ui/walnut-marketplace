import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { creatorProfileExtendedSchema } from "@/lib/validation";

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
    const payload = creatorProfileExtendedSchema.parse(await req.json());
    const existing = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    const { instagramHandle, ...rest } = payload;
    const data = {
      ...rest,
      indiaStateId: payload.indiaStateId ?? null,
      indiaDistrictId: payload.indiaDistrictId ?? null,
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

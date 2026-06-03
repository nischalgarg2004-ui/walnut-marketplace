import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  body: z.string().min(1).max(1200)
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.CREATOR, UserRole.ADMIN]);
    const { id } = await params;

    const requirement = await db.requirement.findUnique({ where: { id }, select: { id: true } });
    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    const comments = await db.requirementComment.findMany({
      where: { requirementId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            role: true,
            creatorProfile: { select: { fullName: true, instagramUsername: true } },
            businessProfile: { select: { brandName: true, instagramUsername: true } }
          }
        }
      }
    });

    const data = comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: {
        userId: c.user.id,
        role: c.user.role,
        name: c.user.creatorProfile?.fullName ?? c.user.businessProfile?.brandName ?? "User",
        handle: c.user.creatorProfile?.instagramUsername ?? c.user.businessProfile?.instagramUsername ?? null
      }
    }));

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.CREATOR, UserRole.ADMIN]);
    const { id } = await params;
    const payload = postSchema.parse(await req.json());

    const requirement = await db.requirement.findUnique({ where: { id }, select: { id: true } });
    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    await db.requirementComment.create({
      data: {
        requirementId: id,
        userId: user.userId,
        body: payload.body.trim()
      }
    });

    const commentCount = await db.requirementComment.count({ where: { requirementId: id } });
    return NextResponse.json({ data: { commentCount } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

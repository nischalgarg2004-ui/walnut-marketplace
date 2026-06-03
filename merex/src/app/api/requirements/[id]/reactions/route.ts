import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  type: z.enum(["LIKE"]).default("LIKE")
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.CREATOR, UserRole.ADMIN]);
    const { id } = await params;
    const payload = bodySchema.parse(await req.json().catch(() => ({})));

    const requirement = await db.requirement.findUnique({ where: { id }, select: { id: true } });
    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    const existing = await db.requirementReaction.findUnique({
      where: {
        requirementId_userId: {
          requirementId: id,
          userId: user.userId
        }
      }
    });

    if (existing) {
      await db.requirementReaction.delete({ where: { id: existing.id } });
    } else {
      await db.requirementReaction.create({
        data: {
          requirementId: id,
          userId: user.userId,
          type: payload.type
        }
      });
    }

    const [reactionCount, viewerReaction] = await Promise.all([
      db.requirementReaction.count({ where: { requirementId: id } }),
      db.requirementReaction.findUnique({
        where: {
          requirementId_userId: {
            requirementId: id,
            userId: user.userId
          }
        },
        select: { type: true }
      })
    ]);

    return NextResponse.json({
      data: {
        reactionCount,
        viewerReaction: viewerReaction?.type ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

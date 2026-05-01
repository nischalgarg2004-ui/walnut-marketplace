import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  channel: z.string().max(60).optional()
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

    await db.requirementShareEvent.create({
      data: {
        requirementId: id,
        userId: user.userId,
        channel: payload.channel?.trim() || null
      }
    });

    const shareCount = await db.requirementShareEvent.count({ where: { requirementId: id } });
    return NextResponse.json({ data: { shareCount } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

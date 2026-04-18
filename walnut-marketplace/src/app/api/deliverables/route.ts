import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const deliverableSchema = z.object({
  contractId: z.string().min(10),
  fileUrl: z.string().url(),
  fileType: z.string().min(2)
});

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR, UserRole.ADMIN]);
    const payload = deliverableSchema.parse(await req.json());

    const creator = await db.creatorProfile.findUnique({ where: { userId: user.userId } });
    if (!creator) return NextResponse.json({ error: "Creator profile not found" }, { status: 400 });

    const created = await db.deliverable.create({
      data: {
        contractId: payload.contractId,
        creatorId: creator.id,
        fileUrl: payload.fileUrl,
        fileType: payload.fileType,
        status: "SUBMITTED"
      }
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

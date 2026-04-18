import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_REVISION"]),
  feedback: z.string().max(1000).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id } = await params;
    const payload = reviewSchema.parse(await req.json());

    const status = payload.action === "APPROVE" ? "APPROVED" : "REVISION_REQUESTED";
    const updated = await db.deliverable.update({
      where: { id },
      data: {
        status,
        feedback: payload.feedback
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

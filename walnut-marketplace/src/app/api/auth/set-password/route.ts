import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { setPasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.CREATOR]);
    const payload = setPasswordSchema.parse(await req.json());
    const passwordHash = await hash(payload.password, 10);
    await db.user.update({
      where: { id: user.userId },
      data: { passwordHash }
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/activity-log";
import { db } from "@/lib/db";

const patchSchema = z
  .object({
    userStatus: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    creatorKycStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    businessVerificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
  })
  .refine((b) => b.userStatus !== undefined || b.creatorKycStatus !== undefined || b.businessVerificationStatus !== undefined, {
    message: "At least one field is required"
  });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = getRequiredSessionUser(req);
    requireRole(actor, [UserRole.ADMIN]);
    const { id: targetUserId } = await params;
    const body = patchSchema.parse(await req.json());

    if (targetUserId === actor.userId) {
      return NextResponse.json({ error: "Cannot change your own account from this screen." }, { status: 400 });
    }

    const target = await db.user.findUnique({
      where: { id: targetUserId },
      include: { creatorProfile: true, businessProfile: true }
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.userStatus === "SUSPENDED" && target.role === UserRole.ADMIN) {
      return NextResponse.json({ error: "Suspending another admin account is not allowed." }, { status: 400 });
    }

    if (body.creatorKycStatus && !target.creatorProfile) {
      return NextResponse.json({ error: "User has no creator profile." }, { status: 400 });
    }

    if (body.businessVerificationStatus && !target.businessProfile) {
      return NextResponse.json({ error: "User has no business profile." }, { status: 400 });
    }

    if (body.userStatus) {
      await db.user.update({
        where: { id: targetUserId },
        data: { status: body.userStatus }
      });
      await writeAudit({
        actorUserId: actor.userId,
        entityType: "USER",
        entityId: targetUserId,
        action: `USER_STATUS_${body.userStatus}`,
        metadata: { targetEmail: target.email, previousStatus: target.status }
      });
    }

    if (body.creatorKycStatus && target.creatorProfile) {
      await db.creatorProfile.update({
        where: { id: target.creatorProfile.id },
        data: { kycStatus: body.creatorKycStatus }
      });
      await writeAudit({
        actorUserId: actor.userId,
        entityType: "CREATOR_PROFILE",
        entityId: target.creatorProfile.id,
        action: `KYC_${body.creatorKycStatus}`,
        metadata: { userId: targetUserId, previous: target.creatorProfile.kycStatus }
      });
    }

    if (body.businessVerificationStatus && target.businessProfile) {
      await db.businessProfile.update({
        where: { id: target.businessProfile.id },
        data: { verificationStatus: body.businessVerificationStatus }
      });
      await writeAudit({
        actorUserId: actor.userId,
        entityType: "BUSINESS_PROFILE",
        entityId: target.businessProfile.id,
        action: `BUSINESS_VERIFICATION_${body.businessVerificationStatus}`,
        metadata: { userId: targetUserId, previous: target.businessProfile.verificationStatus }
      });
    }

    const fresh = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        creatorProfile: { select: { id: true, kycStatus: true } },
        businessProfile: { select: { id: true, verificationStatus: true } }
      }
    });

    return NextResponse.json({ data: fresh });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

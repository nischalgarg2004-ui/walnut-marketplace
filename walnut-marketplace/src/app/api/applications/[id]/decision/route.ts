import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { decisionSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { id } = await params;
    const payload = decisionSchema.parse(await req.json());

    const application = await db.application.findUnique({
      where: { id },
      include: {
        creator: true,
        requirement: { include: { compensation: true } }
      }
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== application.requirement.businessId) {
        return NextResponse.json({ error: "Cannot decide on another brand's application" }, { status: 403 });
      }
    }

    const updated = await db.application.update({
      where: { id },
      data: {
        status: payload.status,
        decisionReason: payload.reason,
        decisionAt: new Date()
      }
    });

    if (payload.status === "APPROVED") {
      const termsSnapshot = {
        requirementId: application.requirementId,
        creatorId: application.creatorId,
        approvedAt: new Date().toISOString()
      };

      const existingContract = await db.contract.findUnique({
        where: { applicationId: application.id }
      });
      if (!existingContract) {
        const created = await db.contract.create({
          data: {
            requirementId: application.requirementId,
            creatorId: application.creatorId,
            businessId: application.requirement.businessId,
            applicationId: application.id,
            termsSnapshotJson: termsSnapshot
          }
        });
        if (application.requirement.compensation?.hasBarter) {
          await db.barterShipment.create({
            data: { contractId: created.id }
          });
        }
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

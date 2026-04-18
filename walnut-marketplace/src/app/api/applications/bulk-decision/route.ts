import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const bulkDecisionSchema = z.object({
  applicationIds: z.array(z.string().min(5)).min(1),
  status: z.enum(["APPROVED", "REJECTED", "WAITLISTED"]),
  reason: z.string().max(500).optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const payload = bulkDecisionSchema.parse(await req.json());

    let ownedRequirementIds: string[] | undefined;
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business) return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
      const ownedRequirements = await db.requirement.findMany({
        where: { businessId: business.id },
        select: { id: true }
      });
      ownedRequirementIds = ownedRequirements.map((r) => r.id);
    }

    const applications = await db.application.findMany({
      where: {
        id: { in: payload.applicationIds },
        ...(ownedRequirementIds ? { requirementId: { in: ownedRequirementIds } } : {})
      },
      include: {
        requirement: { include: { compensation: true } }
      }
    });

    const now = new Date();
    const updated = await Promise.all(
      applications.map((application) =>
        db.application.update({
          where: { id: application.id },
          data: {
            status: payload.status,
            decisionReason: payload.reason,
            decisionAt: now
          }
        })
      )
    );

    if (payload.status === "APPROVED") {
      for (const application of applications) {
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
              termsSnapshotJson: {
                requirementId: application.requirementId,
                creatorId: application.creatorId,
                approvedAt: now.toISOString()
              }
            }
          });
          if (application.requirement.compensation?.hasBarter) {
            await db.barterShipment.create({
              data: { contractId: created.id }
            });
          }
        }
      }
    }

    return NextResponse.json({
      data: {
        requested: payload.applicationIds.length,
        updated: updated.length
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

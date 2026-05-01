import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDeliverablesForContract } from "@/lib/seed-contract-deliverables";
import { writeAudit } from "@/lib/activity-log";

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

    const appIds = applications.map((a) => a.id);
    const existingContracts = appIds.length
      ? await db.contract.findMany({
          where: { applicationId: { in: appIds } },
          select: { applicationId: true }
        })
      : [];
    const lockedIds = new Set(existingContracts.map((c) => c.applicationId));
    if (payload.status !== "APPROVED" && existingContracts.length > 0) {
      return NextResponse.json(
        {
          error:
            "One or more applications already have contracts. Remove those from bulk action to avoid application-contract drift."
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const updated = await Promise.all(
      applications
        .filter((application) => !(payload.status === "APPROVED" && lockedIds.has(application.id)))
        .map((application) =>
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
        if (!lockedIds.has(application.id)) {
          await db.$transaction(async (tx) => {
            const contract = await tx.contract.create({
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
            await createDeliverablesForContract(tx, {
              contractId: contract.id,
              creatorId: application.creatorId,
              requirement: application.requirement
            });
            if (application.requirement.compensation?.hasBarter) {
              await tx.barterShipment.create({
                data: { contractId: contract.id }
              });
            }
          });
        }
      }
    }

    await writeAudit({
      actorUserId: user.userId,
      entityType: "ApplicationBatch",
      entityId: now.toISOString(),
      action: `BULK_DECISION_${payload.status}`,
      metadata: { requested: payload.applicationIds.length, updated: updated.length }
    });

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

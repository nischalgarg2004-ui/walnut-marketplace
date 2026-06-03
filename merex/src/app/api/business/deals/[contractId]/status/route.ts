import { ContractStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const bodySchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED", "DISPUTED"])
});

type Params = { params: Promise<{ contractId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);
    const { contractId } = await params;
    const payload = bodySchema.parse(await req.json());

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { deliverables: true, barterShipment: true, requirement: { include: { compensation: true } } }
    });
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (user.role === UserRole.BUSINESS) {
      const business = await db.businessProfile.findUnique({ where: { userId: user.userId } });
      if (!business || business.id !== contract.businessId) {
        return NextResponse.json({ error: "Cannot update another brand's contract" }, { status: 403 });
      }
    }
    if (payload.status === "COMPLETED") {
      if (contract.status !== ContractStatus.ACTIVE) {
        return NextResponse.json({ error: "Only ACTIVE contracts can be completed" }, { status: 400 });
      }
      const deliverables = await db.deliverable.findMany({
        where: { contractId: contract.id },
        include: { submissions: true }
      });
      const allApproved = deliverables.every((d) => {
        const hasDraftApproved = d.submissions.some((s) => s.stage === "DRAFT" && s.status === "APPROVED");
        const hasPublishApproved = d.submissions.some(
          (s) => s.stage === "PUBLISHED_LINK" && s.status === "APPROVED"
        );
        return contract.requirement.category === "CLIPPING" ? hasPublishApproved : hasDraftApproved && hasPublishApproved;
      });
      if (!allApproved) {
        return NextResponse.json(
          { error: "All required stage approvals (draft/publish) must be complete before completion" },
          { status: 400 }
        );
      }
      if (contract.requirement.compensation?.hasBarter && contract.barterShipment?.status !== "RECEIVED") {
        return NextResponse.json({ error: "Barter shipment must be RECEIVED before completion" }, { status: 400 });
      }
    }

    const updated = await db.contract.update({
      where: { id: contractId },
      data: {
        status: payload.status,
        closedAt: payload.status === "COMPLETED" || payload.status === "CANCELLED" ? new Date() : null
      }
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


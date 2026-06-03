import { PayoutStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const statusParam = req.nextUrl.searchParams.get("status")?.trim();
    const allowed = new Set(Object.values(PayoutStatus));
    const statusFilter =
      statusParam && allowed.has(statusParam as PayoutStatus)
        ? ([statusParam as PayoutStatus] as PayoutStatus[])
        : ([PayoutStatus.PENDING, PayoutStatus.PROCESSING, PayoutStatus.FAILED] as PayoutStatus[]);

    const take = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "50") || 50));

    const payouts = await db.payout.findMany({
      where: { status: { in: statusFilter } },
      orderBy: { id: "desc" },
      take,
      include: {
        contract: {
          include: {
            requirement: { select: { id: true, title: true } },
            business: { select: { id: true, brandName: true } },
            creator: { select: { id: true, fullName: true, instagramUsername: true } }
          }
        }
      }
    });

    return NextResponse.json({
      data: payouts.map((p) => ({
        id: p.id,
        status: p.status,
        grossAmount: p.grossAmount.toString(),
        commissionAmount: p.commissionAmount.toString(),
        netAmount: p.netAmount.toString(),
        payoutProvider: p.payoutProvider,
        payoutRef: p.payoutRef,
        releasedAt: p.releasedAt?.toISOString() ?? null,
        contractId: p.contractId,
        requirementTitle: p.contract.requirement.title,
        brandName: p.contract.business.brandName,
        creatorName: p.contract.creator.fullName,
        creatorInstagram: p.contract.creator.instagramUsername
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

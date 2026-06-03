import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.ADMIN]);

    const [users, requirements, applications, payouts, walletAnomalies, disputedContracts] = await Promise.all([
      db.user.count(),
      db.requirement.count({ where: { status: "PUBLISHED" } }),
      db.application.count(),
      db.payout.aggregate({
        _sum: { grossAmount: true, commissionAmount: true },
        _count: true
      }),
      db.walletAccount.count({
        where: {
          OR: [{ availableBalance: { lt: 0 } }, { reservedBalance: { lt: 0 } }]
        }
      }),
      db.contract.count({ where: { status: "DISPUTED" } })
    ]);

    return NextResponse.json({
      data: {
        users,
        activeRequirements: requirements,
        applications,
        grossMerchandiseValue: payouts._sum.grossAmount ?? 0,
        commissionRevenue: payouts._sum.commissionAmount ?? 0,
        totalPayouts: payouts._count,
        walletAnomalies,
        disputedContracts
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

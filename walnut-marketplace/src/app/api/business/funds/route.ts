import { Prisma, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return Number(value ?? 0);
}

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const business = await db.businessProfile.findUnique({
      where: { userId: user.userId }
    });
    if (!business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const wallet = await db.walletAccount.upsert({
      where: { businessId: business.id },
      update: {},
      create: {
        businessId: business.id
      }
    });

    const commitments = await db.walletCommitment.findMany({
      where: { walletId: wallet.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" }
    });

    const committedSum = commitments.reduce((acc, c) => acc + decimalToNumber(c.amount), 0);
    if (committedSum !== decimalToNumber(wallet.reservedBalance)) {
      await db.walletAccount.update({
        where: { id: wallet.id },
        data: { reservedBalance: committedSum }
      });
    }

    const refreshedWallet = await db.walletAccount.findUnique({
      where: { id: wallet.id }
    });

    const transactions = await db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const requirementIds = Array.from(
      new Set(commitments.map((c) => c.requirementId).filter((id): id is string => Boolean(id)))
    );
    const requirements = requirementIds.length
      ? await db.requirement.findMany({
          where: { id: { in: requirementIds } },
          select: { id: true, title: true }
        })
      : [];
    const requirementName = new Map(requirements.map((r) => [r.id, r.title]));

    const usageByCampaign = commitments.map((c) => ({
      requirementId: c.requirementId,
      campaignTitle: c.requirementId ? requirementName.get(c.requirementId) ?? "Untitled campaign" : "General",
      amount: decimalToNumber(c.amount),
      status: c.status
    }));

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const spendThisMonth = transactions
      .filter((t) => t.createdAt >= monthStart && (t.type === "ALLOCATION" || t.type === "RELEASE"))
      .reduce((acc, t) => acc + decimalToNumber(t.amount), 0);

    return NextResponse.json({
      data: {
        wallet: {
          id: refreshedWallet?.id,
          availableBalance: decimalToNumber(refreshedWallet?.availableBalance),
          reservedBalance: decimalToNumber(refreshedWallet?.reservedBalance),
          currency: refreshedWallet?.currency ?? "INR"
        },
        spendThisMonth,
        usageByCampaign,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          status: t.status,
          amount: decimalToNumber(t.amount),
          description: t.description,
          reference: t.reference,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch funds";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

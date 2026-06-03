import { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";

export class WalletFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletFundsError";
  }
}

export function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function reserveFundsForContract(
  tx: Prisma.TransactionClient,
  input: {
    walletId: string;
    contractId: string;
    requirementId: string;
    amount: number;
    note: string;
  }
) {
  if (input.amount <= 0) return;
  const wallet = await tx.walletAccount.findUnique({ where: { id: input.walletId } });
  if (!wallet) throw new WalletFundsError("WALLET_NOT_FOUND");
  const amount = toDecimal(input.amount);
  if (wallet.availableBalance.lt(amount)) {
    throw new WalletFundsError("INSUFFICIENT_AVAILABLE_BALANCE");
  }

  await tx.walletAccount.update({
    where: { id: input.walletId },
    data: {
      availableBalance: { decrement: amount },
      reservedBalance: { increment: amount }
    }
  });
  await tx.walletCommitment.create({
    data: {
      walletId: input.walletId,
      contractId: input.contractId,
      requirementId: input.requirementId,
      amount,
      status: "ACTIVE",
      note: input.note
    }
  });
  await tx.walletTransaction.create({
    data: {
      walletId: input.walletId,
      type: WalletTransactionType.ALLOCATION,
      status: WalletTransactionStatus.COMPLETED,
      amount,
      description: input.note,
      reference: `RESERVE-${input.contractId}`,
      metadata: { contractId: input.contractId, requirementId: input.requirementId }
    }
  });
}

export async function releaseFundsForContract(
  tx: Prisma.TransactionClient,
  input: { walletId: string; contractId: string; note: string }
) {
  const commitments = await tx.walletCommitment.findMany({
    where: { walletId: input.walletId, contractId: input.contractId, status: "ACTIVE" }
  });
  if (commitments.length === 0) return 0;
  const amount = commitments.reduce((sum, c) => sum + Number(c.amount), 0);
  const amountDecimal = toDecimal(amount);
  await tx.walletCommitment.updateMany({
    where: { walletId: input.walletId, contractId: input.contractId, status: "ACTIVE" },
    data: { status: "RELEASED", note: input.note }
  });
  await tx.walletAccount.update({
    where: { id: input.walletId },
    data: {
      reservedBalance: { decrement: amountDecimal }
    }
  });
  await tx.walletTransaction.create({
    data: {
      walletId: input.walletId,
      type: WalletTransactionType.RELEASE,
      status: WalletTransactionStatus.COMPLETED,
      amount: amountDecimal,
      description: input.note,
      reference: `RELEASE-${input.contractId}`,
      metadata: { contractId: input.contractId }
    }
  });
  return amount;
}


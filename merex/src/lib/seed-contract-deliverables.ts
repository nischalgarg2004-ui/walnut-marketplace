import type { Prisma, Requirement } from "@prisma/client";
import { prismaKindFromSlot, slotsFromRequirement } from "@/lib/deliverable-slots";

type Tx = Prisma.TransactionClient;

export async function createDeliverablesForContract(
  tx: Tx,
  params: {
    contractId: string;
    creatorId: string;
    requirement: Requirement;
  }
): Promise<void> {
  const slots = slotsFromRequirement(params.requirement);
  let i = 0;
  for (const slot of slots) {
    await tx.deliverable.create({
      data: {
        contractId: params.contractId,
        creatorId: params.creatorId,
        fileUrl: "",
        fileType: "pending",
        status: "PENDING",
        expectedKind: prismaKindFromSlot(slot.kind),
        slotIndex: i,
        submittedAt: null
      }
    });
    i++;
  }
}

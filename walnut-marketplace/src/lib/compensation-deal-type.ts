import type { CompensationModel } from "@prisma/client";

export type DealTypeFilter = "fixed" | "cpv" | "barter" | "hybrid" | "all";

export function classifyCompensation(c: CompensationModel | null): DealTypeFilter {
  if (!c) return "all";
  const fixed = Number(c.fixedFeeAmount ?? 0) > 0;
  const cpv = Number(c.cpvRatePer1000 ?? 0) > 0;
  const barter = c.hasBarter === true;
  const paidCount = (fixed ? 1 : 0) + (cpv ? 1 : 0) + (barter ? 1 : 0);
  if (paidCount >= 2) return "hybrid";
  if (barter && !fixed && !cpv) return "barter";
  if (cpv && !fixed) return "cpv";
  if (fixed && !cpv) return "fixed";
  if (cpv && fixed) return "hybrid";
  return "all";
}

export function matchesDealType(c: CompensationModel | null, filter: DealTypeFilter): boolean {
  if (filter === "all") return true;
  const k = classifyCompensation(c);
  if (k === "hybrid" && (filter === "fixed" || filter === "cpv" || filter === "barter")) {
    return true;
  }
  return k === filter;
}

export function estimatedMonetaryValue(c: CompensationModel | null): number {
  if (!c) return 0;
  const fixed = Number(c.fixedFeeAmount ?? 0);
  const cpv = Number(c.cpvRatePer1000 ?? 0);
  return fixed + cpv * 10;
}

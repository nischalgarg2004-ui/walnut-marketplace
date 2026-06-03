export type PayoutCalculationInput = {
  fixedFeeAmount?: number;
  cpvRatePer1000?: number;
  viewsCount?: number;
  commissionPercent: number;
};

export type PayoutCalculationResult = {
  fixedComponentAmount: number;
  cpvComponentAmount: number;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
};

export function calculatePayout(input: PayoutCalculationInput): PayoutCalculationResult {
  const fixedComponentAmount = input.fixedFeeAmount ?? 0;
  const cpvComponentAmount =
    (input.cpvRatePer1000 ?? 0) * Math.max(0, (input.viewsCount ?? 0) / 1000);
  const grossAmount = fixedComponentAmount + cpvComponentAmount;
  const commissionAmount = (grossAmount * input.commissionPercent) / 100;
  const netAmount = Math.max(0, grossAmount - commissionAmount);

  return {
    fixedComponentAmount,
    cpvComponentAmount,
    grossAmount,
    commissionAmount,
    netAmount
  };
}

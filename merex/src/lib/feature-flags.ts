function parseFlag(value: string | undefined, defaultOn = true) {
  if (!value) return defaultOn;
  return value !== "0" && value.toLowerCase() !== "false";
}

export const featureFlags = {
  stageAwareDeliverables: parseFlag(process.env.FEATURE_STAGE_AWARE_DELIVERABLES, true),
  walletLiabilityGates: parseFlag(process.env.FEATURE_WALLET_LIABILITY_GATES, true),
  razorpayWebhookVerify: parseFlag(process.env.FEATURE_RAZORPAY_WEBHOOK_VERIFY, true)
};


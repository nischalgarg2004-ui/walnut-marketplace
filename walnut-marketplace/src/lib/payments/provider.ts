export type ProviderPayoutRequest = {
  payoutId: string;
  amountInPaise: number;
  accountNumber?: string;
  notes?: Record<string, string>;
};

export type ProviderPayoutResponse = {
  providerRef: string;
  status: "queued" | "processing" | "failed";
};

export interface PaymentProvider {
  createPayout(input: ProviderPayoutRequest): Promise<ProviderPayoutResponse>;
}

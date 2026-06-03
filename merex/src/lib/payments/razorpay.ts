import { PaymentProvider, ProviderPayoutRequest, ProviderPayoutResponse } from "./provider";

export class RazorpayProvider implements PaymentProvider {
  async createPayout(input: ProviderPayoutRequest): Promise<ProviderPayoutResponse> {
    // MVP stub. Replace with Razorpay SDK call.
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return {
        providerRef: `mock_${input.payoutId}`,
        status: "processing"
      };
    }

    return {
      providerRef: `rzp_${input.payoutId}`,
      status: "queued"
    };
  }
}

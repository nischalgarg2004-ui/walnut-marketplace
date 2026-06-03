import { BRAND_NAME } from "@/lib/brand";
import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Merex <no-reply@merex.app>";
}

export async function sendBusinessInstagramOtpEmail(params: {
  to: string;
  otp: string;
  minutes: number;
}): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: `${BRAND_NAME} verification code for Instagram linking`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Verify Instagram linking</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:2px">${params.otp}</p>
      <p>This code expires in ${params.minutes} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>`
  });
}

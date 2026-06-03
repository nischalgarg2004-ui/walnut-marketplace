import { createHash } from "crypto";

export function hashConsentPayload(parts: Record<string, string | undefined>): string {
  const stable = JSON.stringify(parts, Object.keys(parts).sort());
  return createHash("sha256").update(stable, "utf8").digest("hex");
}

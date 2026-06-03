import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredSessionUser } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

const trackSchema = z.object({
  event: z.string().min(2),
  metadata: z.record(z.any()).optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    const payload = trackSchema.parse(await req.json());
    await trackEvent(user.userId, payload.event, payload.metadata);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

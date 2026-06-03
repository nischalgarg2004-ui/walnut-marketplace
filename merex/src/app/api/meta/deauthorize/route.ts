import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSignedRequestFromForm } from "@/lib/integrations/meta-signed-request";
import { executeMetaPlatformDeletion } from "@/lib/integrations/meta-platform-deletion";

/**
 * Meta / Instagram Deauthorize Callback URL.
 *
 * Configure in the Meta App Dashboard:
 *   Instagram -> Basic Display / Instagram API setup ->
 *     "Deauthorize Callback URL":
 *       {NEXT_PUBLIC_APP_URL}/api/meta/deauthorize
 *
 * Meta POSTs `signed_request=<sig>.<payload>` (application/x-www-form-urlencoded)
 * whenever a user removes Merex from their Instagram apps list. We verify the
 * signature with the Meta app secret, clear the stored Instagram link and
 * encrypted token for the affected account, and log the request for audit.
 *
 * We respond 200 with no body even on no-match (Meta requires 200 to consider
 * the callback handled; surfacing internal errors back to Meta could leak
 * details about whether a given Instagram user_id is or is not registered).
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form body" }, { status: 400 });
  }

  const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!appSecret) {
    console.error("[meta/deauthorize] missing INSTAGRAM_CLIENT_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let instagramUserId: string;
  try {
    const parsed = parseSignedRequestFromForm(form, appSecret);
    instagramUserId = parsed.userId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signed_request";
    console.warn("[meta/deauthorize] verification failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const confirmationCode = `deauth_${crypto.randomBytes(12).toString("hex")}`;
  let matchedUserId: string | null = null;
  let status: "COMPLETED" | "FAILED" | "NO_MATCH" = "COMPLETED";
  let notes: string | null = null;

  try {
    const result = await executeMetaPlatformDeletion(instagramUserId, "DEAUTHORIZE");
    matchedUserId = result.matchedUserId;
    if (!result.matchedUserId) {
      status = "NO_MATCH";
      notes = "No Merex profile linked to this Instagram user_id at time of deauthorization.";
    } else {
      notes = `Cleared Instagram link on tables: ${result.affectedTables.join(", ") || "none"}.`;
    }
  } catch (err) {
    status = "FAILED";
    notes = err instanceof Error ? err.message : "Unknown error during deauthorize processing";
    console.error("[meta/deauthorize] processing failed", { instagramUserId, error: notes });
  }

  try {
    await db.metaPlatformRequest.create({
      data: {
        confirmationCode,
        kind: "DEAUTHORIZE",
        instagramUserId,
        userId: matchedUserId,
        status,
        notes,
        completedAt: status === "COMPLETED" || status === "NO_MATCH" ? new Date() : null
      }
    });
  } catch (err) {
    console.error("[meta/deauthorize] failed to persist audit row", {
      instagramUserId,
      error: err instanceof Error ? err.message : "unknown"
    });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Meta sometimes pings the URL with a GET during configuration. Reply 200 so
 * the dashboard's reachability probe passes.
 */
export async function GET() {
  return NextResponse.json({ ok: true, kind: "deauthorize" });
}

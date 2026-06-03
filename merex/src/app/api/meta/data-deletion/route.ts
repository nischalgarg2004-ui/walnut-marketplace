import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSignedRequestFromForm } from "@/lib/integrations/meta-signed-request";
import { executeMetaPlatformDeletion } from "@/lib/integrations/meta-platform-deletion";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * Meta / Instagram Data Deletion Request URL.
 *
 * Configure in the Meta App Dashboard:
 *   Instagram -> Basic Display / Instagram API setup ->
 *     "Data Deletion Request URL":
 *       {NEXT_PUBLIC_APP_URL}/api/meta/data-deletion
 *
 * Meta POSTs `signed_request=<sig>.<payload>` whenever a user requests deletion
 * of the data Merex received from Meta. Per Meta's spec, the response MUST be
 * a JSON object containing:
 *   - `url`: a publicly reachable URL where the user can check the status of
 *     their deletion request.
 *   - `confirmation_code`: a stable code the user can reference.
 *
 * We synchronously clear all Instagram-derived fields on the matching profile
 * and persist a row in `MetaPlatformRequest` so the status page can confirm
 * completion.
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
    console.error("[meta/data-deletion] missing INSTAGRAM_CLIENT_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let instagramUserId: string;
  try {
    const parsed = parseSignedRequestFromForm(form, appSecret);
    instagramUserId = parsed.userId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signed_request";
    console.warn("[meta/data-deletion] verification failed", { error: msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const confirmationCode = `del_${crypto.randomBytes(12).toString("hex")}`;
  let matchedUserId: string | null = null;
  let status: "COMPLETED" | "FAILED" | "NO_MATCH" = "COMPLETED";
  let notes: string | null = null;

  try {
    const result = await executeMetaPlatformDeletion(instagramUserId, "DATA_DELETION");
    matchedUserId = result.matchedUserId;
    if (!result.matchedUserId) {
      status = "NO_MATCH";
      notes = "No Merex profile is linked to this Instagram user_id; nothing to delete.";
    } else {
      notes = `Cleared Instagram-derived data on tables: ${result.affectedTables.join(", ") || "none"}.`;
    }
  } catch (err) {
    status = "FAILED";
    notes = err instanceof Error ? err.message : "Unknown error during data-deletion processing";
    console.error("[meta/data-deletion] processing failed", { instagramUserId, error: notes });
  }

  try {
    await db.metaPlatformRequest.create({
      data: {
        confirmationCode,
        kind: "DATA_DELETION",
        instagramUserId,
        userId: matchedUserId,
        status,
        notes,
        completedAt: status === "COMPLETED" || status === "NO_MATCH" ? new Date() : null
      }
    });
  } catch (err) {
    console.error("[meta/data-deletion] failed to persist audit row", {
      instagramUserId,
      error: err instanceof Error ? err.message : "unknown"
    });
  }

  const origin = getRequestOrigin(req);
  const statusUrl = new URL(`/privacy/data-deletion?code=${encodeURIComponent(confirmationCode)}`, origin).toString();

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, kind: "data-deletion" });
}

import type { Metadata } from "next";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO, appUrl } from "@/lib/brand";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Data Deletion Request | ${BRAND_NAME}`,
  description:
    `Check the status of an Instagram / Meta data-deletion request submitted to ${BRAND_NAME}, or learn how to request deletion.`
};

type SearchParams = Promise<{ code?: string }>;

type RequestRow = {
  kind: string;
  status: string;
  receivedAt: Date;
  completedAt: Date | null;
  notes: string | null;
};

async function loadRequest(code: string | undefined): Promise<RequestRow | null> {
  if (!code) return null;
  try {
    const row = await db.metaPlatformRequest.findUnique({
      where: { confirmationCode: code },
      select: {
        kind: true,
        status: true,
        receivedAt: true,
        completedAt: true,
        notes: true
      }
    });
    return row;
  } catch {
    return null;
  }
}

function statusLabel(status: string): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "RECEIVED") return "Received — processing";
  if (status === "NO_MATCH") return "Completed — no data was stored for this Instagram account";
  if (status === "FAILED") return "Failed — please contact support";
  return status;
}

export default async function DataDeletionStatusPage({ searchParams }: { searchParams: SearchParams }) {
  const { code } = await searchParams;
  const row = await loadRequest(code);
  const deauthorizeUrl = appUrl("/api/meta/deauthorize");
  const dataDeletionUrl = appUrl("/api/meta/data-deletion");
  const statusPagePattern = `${appUrl("/privacy/data-deletion")}?code=<confirmation_code>`;

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-3xl">
        <PageScaffold
          eyebrow="Privacy"
          title="Data deletion request"
          description={`Status and instructions for Instagram / Meta data-deletion requests submitted to ${BRAND_NAME}.`}
        >
          <PagePanel
            title={code ? "Request status" : "Look up a request"}
            description={
              code
                ? "Status of the request matching the confirmation code in the URL."
                : "If you initiated deletion from Instagram, Meta will redirect you here with a confirmation code in the URL."
            }
          >
            {code ? (
              row ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Confirmation code
                    </dt>
                    <dd className="mt-1 break-all font-mono text-sm text-foreground">{code}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</dt>
                    <dd className="mt-1 text-foreground">
                      {row.kind === "DATA_DELETION" ? "Data deletion" : "Deauthorization"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
                    <dd className="mt-1 text-foreground">{statusLabel(row.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Received</dt>
                    <dd className="mt-1 text-foreground">{row.receivedAt.toLocaleString()}</dd>
                  </div>
                  {row.completedAt ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Completed
                      </dt>
                      <dd className="mt-1 text-foreground">{row.completedAt.toLocaleString()}</dd>
                    </div>
                  ) : null}
                  {row.notes ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Details
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{row.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="m-0 text-sm text-muted-foreground">
                  We could not find a request with confirmation code{" "}
                  <code className="break-all font-mono">{code}</code>. If you just submitted the request it may
                  take a moment to appear. If the code came directly from Meta, contact{" "}
                  <a className="underline underline-offset-2" href={SUPPORT_MAILTO}>
                    {SUPPORT_EMAIL}
                  </a>
                  {" "}with the code and we will follow up.
                </p>
              )
            ) : (
              <p className="m-0 text-sm text-muted-foreground">
                Paste your confirmation code into the URL as <code>?code=...</code>, or follow the steps below
                to start a new request.
              </p>
            )}
          </PagePanel>

          <PagePanel
            title={`How ${BRAND_NAME} handles Meta / Instagram deletion requests`}
            description={`${BRAND_NAME} complies with Meta Platform Terms and Instagram Platform Policy.`}
          >
            <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                When you remove {BRAND_NAME} from your Instagram apps (Instagram &rarr; Settings &rarr; Security
                &rarr; Apps and Websites), Meta sends a signed deauthorize callback to {BRAND_NAME}. We immediately
                clear the encrypted Instagram access token, the Instagram user id, the handle, follower /
                post / view counts, the profile photo URL, and the connection timestamp for your account.
                Your {BRAND_NAME} account itself is preserved so you can reconnect later if you choose.
              </li>
              <li>
                When you submit a full Instagram data-deletion request, Meta calls our Data Deletion Request
                URL with a signed payload. We do everything the deauthorize step does, and additionally
                remove any Instagram media-id references previously stored against your contracts on {BRAND_NAME}.
                A status row is created so you can verify completion using the confirmation code above.
              </li>
              <li>
                Both endpoints verify Meta&apos;s HMAC-SHA256 signature against our app secret before doing
                any work. Unsigned or malformed requests are rejected.
              </li>
              <li>
                You can also email{" "}
                <a className="underline underline-offset-2" href={SUPPORT_MAILTO}>
                  {SUPPORT_EMAIL}
                </a>{" "}
                to request deletion directly. Include the Instagram handle that was connected to {BRAND_NAME} so
                we can locate the right record.
              </li>
            </ul>
          </PagePanel>

          <PagePanel title="Technical details (for Meta App Review)">
            <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Deauthorize Callback URL:{" "}
                <code className="break-all">{deauthorizeUrl}</code>
              </li>
              <li>
                Data Deletion Request URL:{" "}
                <code className="break-all">{dataDeletionUrl}</code>
              </li>
              <li>
                Status page URL pattern:{" "}
                <code className="break-all">{statusPagePattern}</code>
              </li>
            </ul>
          </PagePanel>
        </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

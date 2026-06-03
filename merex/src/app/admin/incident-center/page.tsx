import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function AdminIncidentCenterPage() {
  return (
    <PageScaffold
      eyebrow="Admin"
      title="Incident center"
      description="Native incident tickets are not stored in-app yet. Use this hub as a launchpad for production incidents and postmortems."
    >
      <PagePanel title="Runbooks and external tools">
        <ul className="clean space-y-3 text-sm leading-relaxed">
          <li>
            <strong>Vercel:</strong> check latest deployment, runtime logs, and function errors for{" "}
            <code className="rounded bg-muted px-1">merex</code>.
          </li>
          <li>
            <strong>Database:</strong> Neon console for connection health, slow queries, and branches.
          </li>
          <li>
            <strong>Instagram / Meta:</strong> App Dashboard for API errors, rate limits, and App Review status.
          </li>
          <li>
            <strong>Payments:</strong> Razorpay dashboard for webhook delivery and settlement anomalies.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <a className="btn secondary" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">
            Vercel dashboard
          </a>
          <Link className="btn secondary" href="/admin/tools/instagram-tester">
            Instagram Graph probe
          </Link>
          <Link className="btn secondary" href="/admin/audit-log">
            Audit log
          </Link>
        </div>
      </PagePanel>
      <PagePanel title="Example severity checklist (process)" className="mt-4">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Confirm user impact (creators vs brands vs payouts).</li>
          <li>Capture time window, request IDs, and first failing dependency.</li>
          <li>Stabilize (rollback deploy, disable feature flag, or scale).</li>
          <li>Log resolution in audit trail or external incident doc.</li>
        </ol>
      </PagePanel>
    </PageScaffold>
  );
}

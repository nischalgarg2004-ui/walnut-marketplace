import Link from "next/link";
import { AdminDashboardMetrics } from "@/components/admin/AdminDashboardMetrics";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function AdminDashboardPage() {
  return (
    <PageScaffold
      eyebrow="Admin"
      title="Operations hub"
      description="Live KPIs from production data. Use the sidebar for moderation, payouts, flags, and audit review."
      actions={
        <>
          <Link className="btn ghost" href="/admin/audit-log">
            Audit log
          </Link>
          <Link className="btn primary" href="/admin/incident-center">
            Incident center
          </Link>
        </>
      }
    >
      <AdminDashboardMetrics />
      <PagePanel title="Primary responsibilities">
        <ul className="clean">
          <li>Requirement and profile moderation queues</li>
          <li>Payout exception handling and reconciliation</li>
          <li>Commission controls and dispute notes</li>
          <li>Audit log reviews and metrics tracking</li>
        </ul>
      </PagePanel>
    </PageScaffold>
  );
}

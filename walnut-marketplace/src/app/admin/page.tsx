import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function AdminDashboardPage() {
  return (
    <PageScaffold
      eyebrow="Admin"
      title="Operations hub"
      description="Moderate marketplace activity, resolve payout exceptions, and monitor platform health from a single command surface."
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
      <section className="layout-grid three">
        <div className="stat">
          <p className="stat-label">Moderation</p>
          <p className="stat-value">Users + Requirements</p>
        </div>
        <div className="stat">
          <p className="stat-label">Payout Risk</p>
          <p className="stat-value">Retry / Hold / Release</p>
        </div>
        <div className="stat">
          <p className="stat-label">Observability</p>
          <p className="stat-value">Metrics + Audit trail</p>
        </div>
      </section>
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

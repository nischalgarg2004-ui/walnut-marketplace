export default function AdminDashboardPage() {
  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Admin Operations Hub</h1>
        <p className="subtitle">
          Moderate marketplace activity, resolve payout exceptions, and monitor platform health.
        </p>
      </div>

      <div className="layout-grid three">
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
      </div>

      <div className="card">
        <h2 className="section-title">Primary Responsibilities</h2>
        <ul className="clean">
          <li>Requirement and profile moderation queues</li>
          <li>Payout exception handling and reconciliation</li>
          <li>Commission controls and dispute notes</li>
          <li>Audit log reviews and metrics tracking</li>
        </ul>
      </div>
    </section>
  );
}

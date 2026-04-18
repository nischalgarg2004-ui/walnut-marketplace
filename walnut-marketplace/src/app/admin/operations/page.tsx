export default function AdminOperationsPage() {
  return (
    <section className="stack">
      <div className="card">
        <h1 className="section-title">Admin Operations API Map</h1>
        <p className="section-subtitle">
          Reference endpoints used by moderation and payout operations.
        </p>
        <ul className="clean">
          <li>
            <span className="pill">GET</span> `/api/admin/metrics` for KPI dashboards
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/moderation/requirements` for moderation queues
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/flags` to flag suspicious entities
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/payouts/[id]/reconcile` for payout exception control
          </li>
        </ul>
      </div>
    </section>
  );
}

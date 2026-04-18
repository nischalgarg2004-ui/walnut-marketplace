import Link from "next/link";

export default function BusinessDashboardPage() {
  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Business Control Center</h1>
        <p className="subtitle">
          Launch creator requirements with precision, review applicants quickly, and run campaign
          operations end-to-end.
        </p>
      </div>

      <div className="layout-grid three">
        <div className="stat">
          <p className="stat-label">Campaign Models</p>
          <p className="stat-value">Barter / Fixed / CPV</p>
        </div>
        <div className="stat">
          <p className="stat-label">Approvals</p>
          <p className="stat-value">Single + Bulk actions</p>
        </div>
        <div className="stat">
          <p className="stat-label">Operations</p>
          <p className="stat-value">Deliverables + Payouts</p>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Operational Shortcuts</h2>
        <p className="section-subtitle">
          Navigate quickly across profile setup, requirement posting, approvals, and payments.
        </p>
        <div className="row">
          <Link className="btn ghost" href="/business/profile">
            Business Profile
          </Link>
          <Link className="btn primary" href="/business/requirements">
            Create Requirement
          </Link>
          <Link className="btn secondary" href="/business/applications">
            Manage Applications
          </Link>
          <Link className="btn ghost" href="/business/deliverables">
            Review Deliverables
          </Link>
          <Link className="btn ghost" href="/business/payouts">
            Payout Operations
          </Link>
          <Link className="btn secondary" href="/business/deals/board">
            Deal board
          </Link>
        </div>
      </div>
    </section>
  );
}

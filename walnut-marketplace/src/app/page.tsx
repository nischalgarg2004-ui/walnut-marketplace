import Link from "next/link";

export default function HomePage() {
  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Creator Growth Starts Here</h1>
        <p className="subtitle">
          Join Walnut to discover paid creator opportunities, apply in minutes, and manage projects,
          payouts, and profile credibility in one dashboard.
        </p>
        <div className="row">
          <Link className="btn primary" href="/signup">
            Create Creator Account
          </Link>
          <Link className="btn secondary" href="/login">
            Login
          </Link>
        </div>
      </div>

      <div className="grid three">
        <div className="stat">
          <p className="stat-label">Discovery</p>
          <p className="stat-value">Find live opportunities</p>
        </div>
        <div className="stat">
          <p className="stat-label">Conversion</p>
          <p className="stat-value">Apply and track status</p>
        </div>
        <div className="stat">
          <p className="stat-label">Payout Clarity</p>
          <p className="stat-value">Project and earnings history</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h2 className="section-title">Signup Options</h2>
          <p className="section-subtitle">
            Continue with Instagram Professional account or create with email/password first and
            connect Instagram after signup.
          </p>
        </div>
        <div className="card">
          <h2 className="section-title">Creator Workspace</h2>
          <p className="section-subtitle">
            After onboarding, navigate discovery feed, applications, projects, earnings, profile, and
            settings from a role-specific creator workspace.
          </p>
        </div>
      </div>
    </section>
  );
}

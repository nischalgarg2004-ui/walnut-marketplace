import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";

export default function HomePage() {
  return (
    <>
      <PublicSiteHeader />
      <main className="main-content">
        <section className="stack">
          <div className="card hero">
            <h1 className="title">Collaborations that stay on brief.</h1>
            <p className="subtitle">
              Walnut connects creators and brands for paid, barter, and UGC-style Instagram campaigns—applications,
              deliverables, and payouts tracked end-to-end.
            </p>
            <div className="row">
              <Link className="btn primary" href="/signup">
                Create account
              </Link>
              <Link className="btn ghost" href="/login">
                Sign in
              </Link>
            </div>
          </div>

          <div className="layout-grid three">
            <div className="stat">
              <p className="stat-label">Discovery</p>
              <p className="stat-value">Structured opportunities</p>
            </div>
            <div className="stat">
              <p className="stat-label">Applications</p>
              <p className="stat-value">Clear status at every step</p>
            </div>
            <div className="stat">
              <p className="stat-label">Payouts</p>
              <p className="stat-value">Transparent deal history</p>
            </div>
          </div>

          <div className="layout-grid two">
            <div className="card">
              <h2 className="section-title">For creators</h2>
              <p className="section-subtitle">
                Find campaigns that fit your niche, apply with context, and manage active deals from one workspace.
              </p>
            </div>
            <div className="card">
              <h2 className="section-title">For brands</h2>
              <p className="section-subtitle">
                Post briefs, review applicants in bulk, verify deliverables, and run payouts without losing the thread.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

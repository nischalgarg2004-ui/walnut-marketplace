import Link from "next/link";

export default function BusinessSettingsPage() {
  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Settings</h1>
        <p className="subtitle">Account preferences and notifications—more controls shipping soon.</p>
      </div>
      <div className="card">
        <p className="muted">
          Notification toggles and team access will live here. For now, update your{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/business/profile">
            company profile
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

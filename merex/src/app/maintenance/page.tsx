import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function MaintenancePage() {
  return (
    <main className="main-content">
      <div className="mx-auto max-w-2xl">
        <PageScaffold
          eyebrow="Maintenance"
          title="Platform maintenance in progress"
          description="We are applying infrastructure updates. Core workflows will return shortly."
        >
          <PagePanel>
            <div className="row">
              <Link className="btn primary" href="/">
                Back to home
              </Link>
              <Link className="btn ghost" href="/notifications">
                Check updates
              </Link>
            </div>
          </PagePanel>
        </PageScaffold>
      </div>
    </main>
  );
}

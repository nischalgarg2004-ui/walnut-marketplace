import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function NotFound() {
  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
        <PageScaffold eyebrow="404" title="Page not found" description="The page may have moved or the link might be outdated.">
          <PagePanel>
            <div className="row">
              <Link className="btn primary" href="/">
                Go to home
              </Link>
              <Link className="btn ghost" href="/search">
                Open command search
              </Link>
            </div>
          </PagePanel>
        </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

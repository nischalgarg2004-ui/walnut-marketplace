import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function SignupPage() {
  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Get Started"
            title="Create your Merex account"
            description="Choose your workspace type to continue with a dedicated onboarding flow."
          >
            <PagePanel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link className="btn primary" href="/signup/creator">
                  Creator signup
                </Link>
                <Link className="btn secondary" href="/signup/business">
                  Business signup
                </Link>
              </div>
              <div className="mt-4">
                <Link className="btn ghost" href="/login">
                  Already have an account
                </Link>
              </div>
            </PagePanel>
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

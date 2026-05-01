import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

export default function LoginPage() {
  return (
    <PublicMarketingShell mainClassName="main-content">
        <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 1"
            title="Choose your workspace"
            description="Pick the space that matches your day. You can switch later from account settings."
            actions={<OnboardingProgressDots total={4} current={0} />}
          >
            <PagePanel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40" href="/login/creator">
                  <p className="text-base font-semibold text-foreground">Creator</p>
                  <p className="mt-1 text-sm text-muted-foreground">Find opportunities, track applications, and ship deliverables.</p>
                </Link>
                <Link className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40" href="/login/business">
                  <p className="text-base font-semibold text-foreground">Business</p>
                  <p className="mt-1 text-sm text-muted-foreground">Review creators, manage campaigns, and close payout cycles.</p>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">New to OnGram?</p>
                <Link className="btn ghost" href="/signup">
                  Create account
                </Link>
              </div>
            </PagePanel>
          </PageScaffold>
        </div>
    </PublicMarketingShell>
  );
}

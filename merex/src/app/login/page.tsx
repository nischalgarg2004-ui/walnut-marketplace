import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const suspended = error === "account_suspended";

  return (
    <PublicMarketingShell mainClassName="main-content">
        <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 1"
            title="Choose your workspace"
            description="Pick the space that matches your day. You can switch later from account settings."
            actions={<OnboardingProgressDots total={4} current={0} />}
          >
            {suspended ? (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                This account has been suspended. If you think this is a mistake, contact support.
              </div>
            ) : null}
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
                <p className="text-sm text-muted-foreground">New to Merex?</p>
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

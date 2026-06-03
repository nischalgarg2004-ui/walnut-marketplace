import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";
import { RoleDefinitionHint } from "@/components/onboarding/RoleDefinitionHint";

export default function CreatorSignupPage() {
  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 3 · Creator Setup"
            title="Create your creator account"
            description="Creator onboarding is Instagram-first. After connect, we route returning creators directly and new creators to profile completion."
            actions={
              <>
                <OnboardingProgressDots total={4} current={2} />
                <a className="btn primary" href="/api/auth/instagram/start?mode=signup&role=creator">
                  Continue with Instagram
                </a>
              </>
            }
          >
            <PagePanel title="Before you continue">
              <div className="stack">
                <p className="section-subtitle">
                  We only support Instagram login for creators. Email/password creator auth is disabled.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <RoleDefinitionHint
                    title="UGC Creator"
                    description="Creates original content and collaborates directly with campaign briefs."
                  />
                  <RoleDefinitionHint
                    title="Editor/Clipper"
                    description="Transforms existing footage into polished short-form edits for distribution."
                  />
                </div>
                <div className="row">
                  <a className="btn primary" href="/api/auth/instagram/start?mode=signup&role=creator">
                    Continue with Instagram
                  </a>
                  <Link className="btn ghost" href="/login/creator">
                    Already connected? Login
                  </Link>
                </div>
              </div>
            </PagePanel>
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

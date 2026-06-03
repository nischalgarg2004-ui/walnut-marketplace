"use client";

import type { Route } from "next";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

function homeForRole(role: string) {
  if (role === "CREATOR") return "/creator";
  if (role === "BUSINESS") return "/business/home";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export default function CreatorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const errorCode = searchParams.get("error");
  const errorMessage = useMemo(() => {
    if (!errorCode) return "";
    if (errorCode === "instagram_profile_fetch_failed") {
      return "Instagram connected, but profile verification failed. Use a Creator/Business (professional) account and try again.";
    }
    if (errorCode === "instagram_state_mismatch" || errorCode === "instagram_invalid_state") {
      return "Instagram login session expired. Please try again.";
    }
    if (errorCode === "instagram_temporary_unavailable") {
      return "Instagram sign-in is temporarily unavailable due to a server issue. Please retry in a moment.";
    }
    if (errorCode === "instagram_token_incompatible") {
      return "Instagram sign-in returned an incompatible token for this app. Please reconnect Instagram from browser and try again.";
    }
    if (errorCode === "instagram_code_exchange_failed" || errorCode === "instagram_callback_failed") {
      return "Could not complete Instagram sign-in. Please retry in your browser.";
    }
    if (errorCode === "account_suspended") {
      return "This account has been suspended. Contact support if you believe this is a mistake.";
    }
    return "Could not complete Instagram login. Please try again.";
  }, [errorCode]);

  useEffect(() => {
    if (errorCode) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (res.status === 403) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login/creator?error=account_suspended";
        return;
      }
      if (!res.ok) return;
      const body = await res.json();
      const role = body.data?.role as string | undefined;
      if (!role) return;
      const next = nextParam;
      const safeNext =
        next &&
        (next.startsWith("/creator") || next.startsWith("/business") || next.startsWith("/admin"))
          ? next
          : null;
      router.replace((safeNext ?? homeForRole(role)) as Route);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextParam, errorCode]);
  const continueHref = "/api/auth/instagram/start?mode=login&role=creator";

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 2 · Creator"
            title="Continue to creator workspace"
            description="Creator access is Instagram-only. Existing creators are routed directly; new creators continue to quick profile completion."
            actions={<OnboardingProgressDots total={4} current={1} />}
          >
            <PagePanel
              title="Continue with Instagram"
              description="If Instagram opens the app and errors, continue in browser and retry once."
              actions={
                <a className="btn primary" href={continueHref}>
                  Continue with Instagram
                </a>
              }
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="m-0">
                  On the Instagram consent screen, Merex requests{" "}
                  <code>instagram_business_basic</code> (identity / profile) and{" "}
                  <code>instagram_business_manage_insights</code> (read insights for your own published media).
                  Approve both to enter the creator workspace.
                </p>
                <p className="m-0">
                  Secure callback and deterministic routing are enabled for supported Merex domains. Merex
                  never asks for your Instagram password.
                </p>
                <p className="m-0">
                  By continuing you agree to our{" "}
                  <a className="underline underline-offset-2" href="/privacy">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </PagePanel>
            {errorMessage ? <p className="mt-2 text-sm text-destructive">{errorMessage}</p> : null}
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

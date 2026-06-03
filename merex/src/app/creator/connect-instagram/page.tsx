"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

type MeResponse = {
  data?: {
    role?: string;
    instagramConnected?: boolean;
    instagramUsername?: string | null;
  };
};

export default function ConnectInstagramPage() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const body = (await res.json()) as MeResponse;
        setConnected(Boolean(body.data?.instagramConnected));
        setUsername(body.data?.instagramUsername ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const oauthError = searchParams.get("error");
  const oauthErrorCopy =
    oauthError === "instagram_state_mismatch"
      ? "Session expired while connecting Instagram. Please try again."
      : oauthError === "instagram_code_exchange_failed"
        ? "Instagram login could not be completed. Please retry in browser."
        : oauthError === "instagram_token_incompatible"
          ? "Instagram returned an incompatible token for this app. Please reconnect Instagram in browser."
          : oauthError === "instagram_profile_fetch_failed"
            ? "Instagram connected, but profile verification failed. Try reconnecting."
            : oauthError === "instagram_callback_failed"
              ? "Unexpected Instagram callback error. Please try again."
              : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageScaffold
        eyebrow="Creator setup"
        title="Connect your Instagram professional account"
        description="Merex uses Instagram Login (not Facebook Login) to verify your handle and read public metrics for your own content."
        actions={<OnboardingProgressDots total={4} current={2} />}
      >
        <PagePanel
          title={connected ? "Instagram connected" : "Continue with Instagram"}
          description={
            connected
              ? "Your Instagram professional account is linked. Continue to your creator home."
              : "You'll be redirected to Instagram, then back to Merex after you approve the requested permissions."
          }
          actions={
            connected ? (
              <a className="btn primary" href="/creator">
                Go to Creator Home
              </a>
            ) : (
              <a className="btn primary" href="/api/auth/instagram/start?mode=connect">
                Connect Instagram Professional
              </a>
            )
          }
        >
          {loading ? <p className="help m-0">Checking connection status…</p> : null}
          {oauthErrorCopy ? (
            <p className="m-0 mb-3 text-sm text-destructive" role="status">
              {oauthErrorCopy}
            </p>
          ) : null}

          {connected ? (
            <p className="help m-0">
              Connected as <strong>@{username ?? "instagram-user"}</strong>.
            </p>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="m-0">
                On the Instagram consent screen, approve both permissions Merex requests:
              </p>
              <ul className="m-0 list-disc space-y-1 pl-5">
                <li>
                  <code>instagram_business_basic</code> — read your handle, photo, follower count, and post count
                  via Instagram Graph <code>/me</code>.
                </li>
                <li>
                  <code>instagram_business_manage_insights</code> — read insights for your own published media via
                  Instagram Graph <code>/&#123;media-id&#125;/insights</code> so the platform can verify campaign
                  performance.
                </li>
              </ul>
              <p className="m-0">
                Merex never asks for your Instagram password. The connection is OAuth-based and uses long-lived
                tokens encrypted at rest.
              </p>
              <p className="m-0">
                By continuing you agree to our{" "}
                <a className="underline underline-offset-2" href="/privacy">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}
        </PagePanel>
      </PageScaffold>
    </div>
  );
}

"use client";

import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loginInFlightRef.current) return;
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok || cancelled) return;
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
  }, [router, nextParam]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    loginInFlightRef.current = true;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          next: nextParam || undefined
        }),
        credentials: "include"
      });

      let result: { error?: string; data?: { role?: string; redirect?: string } } = {};
      try {
        result = await response.json();
      } catch {
        setError("Invalid response from server");
        loginInFlightRef.current = false;
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(result.error ?? "Login failed");
        loginInFlightRef.current = false;
        setLoading(false);
        return;
      }

      const role = result.data?.role as "CREATOR" | "BUSINESS" | "ADMIN" | undefined;
      if (!role) {
        setError("Login response missing role");
        loginInFlightRef.current = false;
        setLoading(false);
        return;
      }

      const target = (result.data?.redirect ?? homeForRole(role)) as Route;
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      loginInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 2 · Creator"
            title="Continue to creator workspace"
            description="Use Instagram for the fastest path. If you prefer, sign in with email below."
            actions={<OnboardingProgressDots total={4} current={1} />}
          >
            <PagePanel
              title="Fastest route"
              description="We will route existing creators directly. New creators only fill missing profile details."
              actions={
                <a className="btn primary" href="/api/auth/instagram/start?mode=login&role=creator">
                  Continue with Instagram
                </a>
              }
            >
              <p className="text-sm text-muted-foreground">Secure callback and deterministic routing are enabled for all supported OnGram domains.</p>
            </PagePanel>
            <PagePanel title="Sign in with email">
              <form onSubmit={onSubmit} className="form-grid">
                <input className="form-full" name="email" placeholder="Email" type="email" required />
                <input className="form-full" name="password" placeholder="Password" type="password" required />
                <div className="form-full row">
                  <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                  <Link className="btn ghost" href="/signup/creator">
                    Complete new creator setup
                  </Link>
                </div>
              </form>
              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            </PagePanel>
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

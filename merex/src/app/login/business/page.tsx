"use client";

import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

function homeForRole(role: string) {
  if (role === "BUSINESS") return "/business/home";
  if (role === "CREATOR") return "/creator";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export default function BusinessLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const urlError = searchParams.get("error");
  const urlErrorMessage =
    urlError === "account_suspended"
      ? "This account has been suspended. Contact support if you believe this is a mistake."
      : "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loginInFlightRef.current) return;
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;
      if (res.status === 403) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login/business?error=account_suspended";
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
            eyebrow="Step 2 · Business"
            title="Choose business sign in method"
            description="Use one method now and connect the other later from your business settings."
            actions={<OnboardingProgressDots total={4} current={1} />}
          >
            <PagePanel
              title="Select your primary method"
              actions={
                <a className="btn primary" href="/api/auth/instagram/start?mode=login&role=business">
                  Continue with Instagram
                </a>
              }
            >
              <p className="text-sm text-muted-foreground">Instagram is the fastest login path for teams managing creator campaigns.</p>
            </PagePanel>
            <PagePanel title="Or continue with business email">
              {urlErrorMessage ? <p className="mb-3 text-sm text-destructive">{urlErrorMessage}</p> : null}
              <form onSubmit={onSubmit} className="form-grid">
                <input className="form-full" name="email" placeholder="Business email" type="email" required />
                <input className="form-full" name="password" placeholder="Password" type="password" required />
                <div className="form-full row">
                  <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Continue with Business Email"}
                  </button>
                  <Link className="btn ghost" href="/signup/business">
                    Complete new business setup
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

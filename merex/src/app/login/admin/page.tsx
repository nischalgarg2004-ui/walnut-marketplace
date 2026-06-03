"use client";

import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const urlError = searchParams.get("error");
  const urlErrorMessage =
    urlError === "account_suspended"
      ? "This account has been suspended. Contact support if you believe this is a mistake."
      : urlError === "wrong_role"
        ? "This area needs an administrator account. Sign in below with admin email and password (your current session will switch to admin when you succeed), or use Back to return to the main site."
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
        window.location.href = "/login/admin?error=account_suspended";
        return;
      }
      if (!res.ok) return;
      const body = await res.json();
      const role = body.data?.role as string | undefined;
      if (!role) return;
      if (role !== "ADMIN") {
        setError(
          "You are signed in, but not as an administrator. Enter admin email and password below to open the admin console."
        );
        return;
      }
      const next = nextParam;
      const safeNext = next && next.startsWith("/admin") ? next : null;
      router.replace((safeNext ?? "/admin") as Route);
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

      const role = result.data?.role as string | undefined;
      if (role !== "ADMIN") {
        setError("This portal is for administrators only.");
        loginInFlightRef.current = false;
        setLoading(false);
        return;
      }

      const target = (result.data?.redirect ?? "/admin") as Route;
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      loginInFlightRef.current = false;
      setLoading(false);
    }
  }

  const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const mainLoginHref = appBase ? `${appBase}/login` : "";

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-lg">
        <PageScaffold
          eyebrow="Admin"
          title="Administrator sign in"
          description="Use the email and password for your Merex admin account. Creator and business sign-in use the main site."
        >
          <PagePanel title="Email and password">
            {urlErrorMessage ? <p className="mb-3 text-sm text-destructive">{urlErrorMessage}</p> : null}
            <form onSubmit={onSubmit} className="form-grid">
              <input className="form-full" name="email" placeholder="Admin email" type="email" required autoComplete="username" />
              <input
                className="form-full"
                name="password"
                placeholder="Password"
                type="password"
                required
                autoComplete="current-password"
              />
              <div className="form-full row">
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in to admin"}
                </button>
              </div>
            </form>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </PagePanel>
          {mainLoginHref ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <a href={mainLoginHref} className="underline underline-offset-2">
                Back to main site login
              </a>
            </p>
          ) : null}
        </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

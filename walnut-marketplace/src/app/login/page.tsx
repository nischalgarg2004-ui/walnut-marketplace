"use client";

import type { Route } from "next";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function homeForRole(role: string) {
  if (role === "CREATOR") return "/creator/dashboard";
  if (role === "BUSINESS") return "/business";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  /** While a login POST is in flight, skip /api/auth/me auto-redirect (avoids racing client navigation). */
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
    <section className="stack" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card hero">
        <h1 className="title">Login</h1>
        <p className="subtitle">Login with email/password or continue with Instagram.</p>
        <div className="row">
          <a className="btn secondary" href="/api/auth/instagram/start?mode=login">
            Continue with Instagram
          </a>
          <Link className="btn ghost" href="/signup">
            Need an account?
          </Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={onSubmit} className="form-grid">
          <input className="form-full" name="email" placeholder="Email" type="email" required />
          <input className="form-full" name="password" placeholder="Password" type="password" required />
          <div className="form-full row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        {error ? <p className="help" style={{ color: "#b91c1c" }}>{error}</p> : null}
      </div>
    </section>
  );
}

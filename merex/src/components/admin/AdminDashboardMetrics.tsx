"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Metrics = {
  users: number;
  activeRequirements: number;
  applications: number;
  grossMerchandiseValue: number;
  commissionRevenue: number;
  totalPayouts: number;
};

export function AdminDashboardMetrics() {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/metrics", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load metrics");
        if (!cancelled) setData(json.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="layout-grid three">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="stat animate-pulse">
            <p className="stat-label text-muted-foreground">…</p>
            <p className="stat-value text-muted-foreground">—</p>
          </div>
        ))}
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="card border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error ?? "Could not load platform metrics."}
      </div>
    );
  }

  const money = (n: number) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <>
    <section className="layout-grid three">
      <div className="stat">
        <p className="stat-label">Registered users</p>
        <p className="stat-value tabular-nums">{data.users.toLocaleString("en-IN")}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Published requirements</p>
        <p className="stat-value tabular-nums">{data.activeRequirements.toLocaleString("en-IN")}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Applications</p>
        <p className="stat-value tabular-nums">{data.applications.toLocaleString("en-IN")}</p>
      </div>
      <div className="stat">
        <p className="stat-label">GMV (payout gross)</p>
        <p className="stat-value tabular-nums">{money(Number(data.grossMerchandiseValue))}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Commission revenue</p>
        <p className="stat-value tabular-nums">{money(Number(data.commissionRevenue))}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Payout rows</p>
        <p className="stat-value tabular-nums">{data.totalPayouts.toLocaleString("en-IN")}</p>
      </div>
    </section>
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="m-0 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick links</p>
      <div className="flex flex-wrap gap-2">
        <Link className="btn secondary text-xs" href="/admin/moderation">
          Moderation
        </Link>
        <Link className="btn secondary text-xs" href="/admin/payouts">
          Payouts
        </Link>
        <Link className="btn secondary text-xs" href="/admin/flags">
          Flags
        </Link>
        <Link className="btn secondary text-xs" href="/admin/audit-log">
          Audit log
        </Link>
      </div>
    </div>
  </>
  );
}

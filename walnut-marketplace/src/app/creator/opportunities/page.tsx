"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type Row = {
  id: string;
  title: string;
  brief: string;
  createdAt: string;
  eligible?: boolean;
  business?: { brandName?: string };
  compensation?: {
    fixedFeeAmount: string | null;
    cpvRatePer1000: string | null;
    hasBarter: boolean;
  };
};

export default function CreatorOpportunitiesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [dealType, setDealType] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  async function load() {
    const me = await fetch("/api/auth/me");
    const meData = await me.json();
    if (!me.ok || !meData.data?.instagramConnected) {
      window.location.assign("/creator/connect-instagram");
      return;
    }
    const params = new URLSearchParams();
    params.set("eligibleOnly", eligibleOnly ? "true" : "false");
    if (dealType !== "all") params.set("dealType", dealType);
    params.set("sort", sort);
    const response = await fetch(`/api/creator/opportunities?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) {
      setToast({ message: result.error ?? "Failed to load", type: "error" });
      return;
    }
    setItems(result.data ?? []);
    setMeta(result.meta ?? null);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => setToast({ message: "Failed to load opportunities", type: "error" }))
      .finally(() => setLoading(false));
  }, [eligibleOnly, dealType, sort]);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Opportunities</h1>
        <p className="subtitle">
          Filter by eligibility and deal type. Only published campaigns you can apply to are listed when “Eligible
          only” is on.
        </p>
      </div>

      <div className="card row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <label className="muted">
          <input
            type="checkbox"
            checked={eligibleOnly}
            onChange={(e) => setEligibleOnly(e.target.checked)}
          />{" "}
          Eligible only
        </label>
        <label className="muted">
          Deal type{" "}
          <select value={dealType} onChange={(e) => setDealType(e.target.value)}>
            <option value="all">All</option>
            <option value="fixed">Fixed pay</option>
            <option value="cpv">Per-view (CPV)</option>
            <option value="barter">Barter</option>
            <option value="hybrid">Mixed / hybrid</option>
          </select>
        </label>
        <label className="muted">
          Sort{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="value">Highest value (approx.)</option>
          </select>
        </label>
        {meta ? (
          <span className="muted">
            {meta.total} result{meta.total === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="card">
        {loading && (
          <div className="list">
            <div className="skeleton skeleton-card" />
          </div>
        )}
        <div className="list">
          {!loading && items.length === 0 && (
            <div className="empty">
              <div className="empty-visual" />
              No opportunities match your filters.
            </div>
          )}
          {items.map((item) => (
            <article className="card" key={item.id}>
              <h3 className="item-title">{item.title}</h3>
              <p className="muted">{item.brief.slice(0, 200)}…</p>
              <p className="muted">
                Brand: {item.business?.brandName ?? "—"} · Eligible: {item.eligible ? "yes" : "no"}
              </p>
              <Link className="btn primary" href={`/creator/opportunity/${item.id}`}>
                View &amp; apply
              </Link>
            </article>
          ))}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ClipCampaign = {
  id: string;
  title: string;
  status: string;
  category?: "UGC" | "CLIPPING";
  createdAt: string;
  clippingSummary?: { sourceCount?: number } | null;
  _count?: { applications?: number; applicationsApproved?: number };
};

export default function BusinessClipsPage() {
  const [items, setItems] = useState<ClipCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/business/requirements");
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Unable to load clipping campaigns");
        setLoading(false);
        return;
      }
      setItems((json.data ?? []).filter((item: ClipCampaign) => (item.category ?? "UGC") === "CLIPPING"));
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(
    () => ({
      campaigns: items.length,
      applications: items.reduce((acc, item) => acc + (item._count?.applications ?? 0), 0),
      approved: items.reduce((acc, item) => acc + (item._count?.applicationsApproved ?? 0), 0)
    }),
    [items]
  );

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Clips Operations</h1>
        <p className="subtitle">Review clipping campaigns, moderate submissions, and verify publish workflows.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="pill">Campaigns: {totals.campaigns}</span>
          <span className="pill">Applications: {totals.applications}</span>
          <span className="pill">Approved: {totals.approved}</span>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="card list">
        {loading ? <p className="help">Loading clips operations...</p> : null}
        {!loading && items.length === 0 ? (
          <div className="card">
            <p className="m-0 text-sm text-muted-foreground">No clipping campaigns yet.</p>
            <Link href="/business/campaigns/create" className="btn primary mt-3 inline-flex">
              Create clipping campaign
            </Link>
          </div>
        ) : null}
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="item-head">
              <h3 className="item-title">{item.title}</h3>
              <span className="pill">{item.status}</span>
            </div>
            <p className="muted">Created: {new Date(item.createdAt).toLocaleString()}</p>
            <p className="muted">
              Sources: {item.clippingSummary?.sourceCount ?? 0} · Applications: {item._count?.applications ?? 0} · Approved:{" "}
              {item._count?.applicationsApproved ?? 0}
            </p>
            <div className="row mt-2">
              <Link className="btn primary" href={`/business/campaigns/${item.id}`}>
                Open review panel
              </Link>
              <Link className="btn ghost" href={`/business/campaigns?highlight=${item.id}`}>
                View in feed
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

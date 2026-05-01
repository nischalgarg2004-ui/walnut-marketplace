"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ClipApplication = {
  id: string;
  status: string;
  appliedAt: string;
  requirement: {
    id: string;
    title: string;
    category?: "UGC" | "CLIPPING";
    business: { brandName: string };
  };
  clippingLifecycleStatus?: string | null;
  clippingDestinationHandle?: string | null;
  clippingSampleUrl?: string | null;
  clippingFinalUrl?: string | null;
  decisionReason?: string | null;
};

export default function CreatorClipsPage() {
  const [items, setItems] = useState<ClipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/creator/applications");
      if (response.status === 412) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Failed to load clips");
        setLoading(false);
        return;
      }
      setItems((json.data ?? []).filter((a: ClipApplication) => a.requirement?.category === "CLIPPING"));
      setLoading(false);
    })();
  }, []);

  const summary = useMemo(() => {
    return {
      total: items.length,
      revisions: items.filter((a) => a.clippingLifecycleStatus === "REVISION_REQUESTED").length,
      verified: items.filter((a) => a.clippingLifecycleStatus === "VERIFIED").length
    };
  }, [items]);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Clips Workspace</h1>
        <p className="subtitle">Manage clipping applications, revisions, and final publish submissions.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="pill">Total: {summary.total}</span>
          <span className="pill">Revisions: {summary.revisions}</span>
          <span className="pill">Verified: {summary.verified}</span>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="card list">
        {loading ? <p className="help">Loading clipping applications...</p> : null}
        {!loading && items.length === 0 ? (
          <div className="card">
            <p className="m-0 text-sm text-muted-foreground">No clipping applications yet.</p>
            <Link href="/creator/opportunities" className="btn ghost mt-3 inline-flex">
              Explore opportunities
            </Link>
          </div>
        ) : null}
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="item-head">
              <h3 className="item-title">{item.requirement.title}</h3>
              <span className="pill">{item.clippingLifecycleStatus ?? "SOURCE_RECEIVED"}</span>
            </div>
            <p className="muted">Brand: {item.requirement.business.brandName}</p>
            <p className="muted">Applied: {new Date(item.appliedAt).toLocaleString()}</p>
            {item.clippingDestinationHandle ? <p className="muted">Destination: @{item.clippingDestinationHandle}</p> : null}
            {item.decisionReason ? (
              <p className="rounded-md border border-amber-300/40 bg-amber-50/80 p-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Feedback: {item.decisionReason}
              </p>
            ) : null}
            <div className="row mt-2">
              <Link className="btn primary" href={`/creator/opportunity/${item.requirement.id}`}>
                Open workspace
              </Link>
              {item.clippingFinalUrl ? (
                <a href={item.clippingFinalUrl} target="_blank" rel="noreferrer" className="btn ghost">
                  View final post
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

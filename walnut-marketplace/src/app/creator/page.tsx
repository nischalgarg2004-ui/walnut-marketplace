"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { OpportunityCard } from "@/components/design-system/OpportunityCard";

type Opportunity = {
  id: string;
  title: string;
  brief: string;
};

export default function CreatorHomePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
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
    const response = await fetch("/api/requirements");
    const result = await response.json();
    setItems(result.data ?? []);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => setToast({ message: "Failed to load opportunities", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Home</h1>
        <p className="subtitle">
          Collaborations that stay on brief—browse live opportunities, apply in minutes, and track deals in one
          place.
        </p>
        <div className="row">
          <Link className="btn primary" href="/creator/opportunities">
            Browse opportunities
          </Link>
          <Link className="btn ghost" href="/creator/deals">
            My deals
          </Link>
        </div>
      </div>

      <div>
        <h2 className="section-title">New for you</h2>
        <p className="section-subtitle">A snapshot of published campaigns—open the feed for filters and eligibility.</p>
      </div>

      <div className="card">
        {loading && (
          <div className="list">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {!loading && items.length === 0 && (
            <div className="empty md:col-span-2">
              <div className="empty-visual" />
              No opportunities available right now.
            </div>
          )}
          {!loading &&
            items.slice(0, 6).map((item) => (
              <OpportunityCard
                key={item.id}
                id={item.id}
                title={item.title}
                briefExcerpt={item.brief.length > 200 ? `${item.brief.slice(0, 200)}…` : item.brief}
                href={`/creator/opportunity/${item.id}`}
                ctaLabel="View opportunity"
              />
            ))}
        </div>
        {!loading && items.length > 6 ? (
          <p className="mt-4 text-center">
            <Link className="btn secondary" href="/creator/opportunities">
              See all opportunities
            </Link>
          </p>
        ) : null}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LinkedInCampaignPost, type LinkedInCampaignPostData } from "@/components/design-system/LinkedInCampaignPost";
import Toast from "@/components/ui/Toast";

type Row = {
  id: string;
  title: string;
  brief: string;
  postText?: string | null;
  postImageUrl?: string | null;
  status: string;
  createdAt: string;
  spentAmount?: number;
  authorHref?: string;
  criteriaNarrative?: string;
  category?: "UGC" | "CLIPPING";
  clippingSummary?: { sourceCount?: number } | null;
  personaFit?: boolean;
  eligible?: boolean;
  business?: { brandName?: string };
  compensation?: {
    fixedFeeAmount: string | null;
    cpvRatePer1000: string | null;
    hasBarter: boolean;
  };
  _count?: { reactions: number; comments: number; shareEvents: number };
  viewerReaction?: "LIKE" | null;
};

export default function CreatorOpportunitiesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [dealType, setDealType] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "UGC" | "CLIPPING">("ALL");
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
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
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
  }, [eligibleOnly, dealType, sort, categoryFilter]);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Opportunities</h1>
        <p className="subtitle">
          Campaigns you can apply to right now. When “Eligible only” is on, we hide briefs you don’t qualify for.
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground">Category</span>
          <div className="inline-flex min-h-touch rounded-full border border-border bg-muted/40 p-1 shadow-sm">
            {(["ALL", "UGC", "CLIPPING"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`min-h-touch rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "ALL" ? "All" : cat === "UGC" ? "UGC" : "Clipping"}
              </button>
            ))}
          </div>
        </div>
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
        <div className="grid grid-cols-1 gap-4">
          {!loading && items.length === 0 && (
            <div className="empty md:col-span-2">
              <div className="empty-visual" />
              No opportunities match your filters.
            </div>
          )}
          {items.map((item) => {
            const categoryLabel = item.category ?? "UGC";
            const clippingNote =
              categoryLabel === "CLIPPING" && item.clippingSummary?.sourceCount
                ? `\n\nClipping sources: ${item.clippingSummary.sourceCount}`
                : "";
            const post: LinkedInCampaignPostData = {
              id: item.id,
              title: item.title,
              postText: `${item.postText ?? item.brief}${clippingNote}`,
              postImageUrl: item.postImageUrl ?? null,
              brandName: item.business?.brandName ?? "Brand",
              createdAt: item.createdAt,
              reactionCount: item._count?.reactions ?? 0,
              commentCount: item._count?.comments ?? 0,
              shareCount: item._count?.shareEvents ?? 0,
              viewerReaction: item.viewerReaction ?? null,
              spentAmount: item.spentAmount ?? 0,
              authorHref: item.authorHref ?? `/creator/opportunity/${item.id}`,
              criteriaNarrative: item.criteriaNarrative ?? "",
              postHref: `/creator/opportunity/${item.id}`,
              applyHref: item.personaFit === false ? "/creator/profile" : `/creator/opportunity/${item.id}`,
              applyLabel: item.personaFit === false ? "Set up clipping profile" : "Apply"
            };
            return <LinkedInCampaignPost key={item.id} post={post} />;
          })}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

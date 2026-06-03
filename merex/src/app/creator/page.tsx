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
  createdAt: string;
  spentAmount?: number;
  authorHref?: string;
  criteriaNarrative?: string;
  category?: "UGC" | "CLIPPING";
  clippingSummary?: { sourceCount?: number } | null;
  personaFit?: boolean;
  compensation?: {
    fixedFeeAmount: string | null;
    cpvRatePer1000: string | null;
    hasBarter: boolean;
  };
  business?: { brandName?: string };
  _count?: { reactions: number; comments: number; shareEvents: number };
  viewerReaction?: "LIKE" | null;
};

export default function CreatorHomePage() {
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{ total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [barterOnly, setBarterOnly] = useState(false);
  const [fixedPayOnly, setFixedPayOnly] = useState(false);
  const [cpvOnly, setCpvOnly] = useState(false);
  const [sort, setSort] = useState<string>("newest");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "UGC" | "CLIPPING">("ALL");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cpvMinSelected, setCpvMinSelected] = useState(0);
  const [cpvMaxSelected, setCpvMaxSelected] = useState(0);
  const [cpvBounds, setCpvBounds] = useState<{ min: number; max: number } | null>(null);
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
    if (meData.data?.onboardingRequired) {
      window.location.assign("/creator/profile?onboarding=1");
      return;
    }
    const params = new URLSearchParams();
    params.set("eligibleOnly", eligibleOnly ? "true" : "false");
    params.set("sort", sort);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
    const response = await fetch(`/api/creator/opportunities?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) {
      setToast({ message: result.error ?? "Failed to load opportunities", type: "error" });
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
  }, [eligibleOnly, sort, categoryFilter]);

  useEffect(() => {
    const cpvValues = items
      .map((item) => Number(item.compensation?.cpvRatePer1000 ?? 0))
      .filter((v) => Number.isFinite(v) && v > 0);
    if (cpvValues.length === 0) {
      setCpvBounds(null);
      setCpvMinSelected(0);
      setCpvMaxSelected(0);
      return;
    }
    const min = Math.floor(Math.min(...cpvValues));
    const max = Math.ceil(Math.max(...cpvValues));
    setCpvBounds({ min, max });
    setCpvMinSelected((prev) => (prev === 0 ? min : Math.max(min, Math.min(prev, max))));
    setCpvMaxSelected((prev) => (prev === 0 ? max : Math.max(min, Math.min(prev, max))));
  }, [items]);

  const filteredItems = items.filter((item) => {
    const comp = item.compensation;
    if (!comp) return !barterOnly && !fixedPayOnly && !cpvOnly;
    const cpv = Number(comp.cpvRatePer1000 ?? 0);
    const fixed = Number(comp.fixedFeeAmount ?? 0);
    const hasBarter = comp.hasBarter === true;
    const hasFixed = fixed > 0;
    const hasCpv = cpv > 0;
    const needsTypeFilter = barterOnly || fixedPayOnly || cpvOnly;
    if (!needsTypeFilter) return true;

    const cpvPass =
      cpvOnly && hasCpv && (!cpvBounds || (cpv >= Math.min(cpvMinSelected, cpvMaxSelected) && cpv <= Math.max(cpvMinSelected, cpvMaxSelected)));
    return (barterOnly && hasBarter) || (fixedPayOnly && hasFixed) || cpvPass;
  });

  const cpvRangeMin = cpvBounds ? cpvBounds.min : 0;
  const cpvRangeMax = cpvBounds ? cpvBounds.max : 0;
  const cpvLow = Math.min(cpvMinSelected, cpvMaxSelected);
  const cpvHigh = Math.max(cpvMinSelected, cpvMaxSelected);
  const cpvDenominator = Math.max(1, cpvRangeMax - cpvRangeMin);
  const cpvLeftPct = ((cpvLow - cpvRangeMin) / cpvDenominator) * 100;
  const cpvRightPct = ((cpvHigh - cpvRangeMin) / cpvDenominator) * 100;

  function FiltersPanel() {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold text-foreground">Filters</h2>
          {meta ? (
            <span className="text-xs text-muted-foreground">
              {meta.total} result{meta.total === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={`inline-flex min-h-touch w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
            eligibleOnly ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
          }`}
          onClick={() => setEligibleOnly((v) => !v)}
        >
          <span>Eligible only</span>
          <span aria-hidden>{eligibleOnly ? "✓" : ""}</span>
        </button>
        <div className="space-y-2">
          <p className="m-0 text-sm text-muted-foreground">Compensation filters</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className={`inline-flex min-h-touch items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                barterOnly ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
              onClick={() => setBarterOnly((v) => !v)}
            >
              <span>Barter</span>
              <span aria-hidden>{barterOnly ? "✓" : ""}</span>
            </button>
            <button
              type="button"
              className={`inline-flex min-h-touch items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                fixedPayOnly ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
              onClick={() => setFixedPayOnly((v) => !v)}
            >
              <span>Fixed pay</span>
              <span aria-hidden>{fixedPayOnly ? "✓" : ""}</span>
            </button>
            <button
              type="button"
              className={`inline-flex min-h-touch items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                cpvOnly ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
              onClick={() => setCpvOnly((v) => !v)}
            >
              <span>Per-View</span>
              <span aria-hidden>{cpvOnly ? "✓" : ""}</span>
            </button>
          </div>
          {cpvOnly ? (
            cpvBounds ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="m-0 text-xs text-muted-foreground">
                  ₹{Math.min(cpvMinSelected, cpvMaxSelected).toLocaleString("en-IN")} - ₹
                  {Math.max(cpvMinSelected, cpvMaxSelected).toLocaleString("en-IN")} per 1K views
                </p>
                <div className="cpv-dual-range">
                  <div className="cpv-dual-range__track" />
                  <div
                    className="cpv-dual-range__active"
                    style={{
                      left: `${cpvLeftPct}%`,
                      width: `${Math.max(0, cpvRightPct - cpvLeftPct)}%`
                    }}
                  />
                  <input
                    type="range"
                    min={cpvBounds.min}
                    max={cpvBounds.max}
                    value={cpvMinSelected}
                    onChange={(e) => setCpvMinSelected(Number(e.target.value))}
                    className="cpv-dual-range__input cpv-dual-range__input--min"
                    aria-label="Minimum per-view payout"
                  />
                  <input
                    type="range"
                    min={cpvBounds.min}
                    max={cpvBounds.max}
                    value={cpvMaxSelected}
                    onChange={(e) => setCpvMaxSelected(Number(e.target.value))}
                    className="cpv-dual-range__input cpv-dual-range__input--max"
                    aria-label="Maximum per-view payout"
                  />
                </div>
                <p className="m-0 text-[11px] text-muted-foreground">
                  Available range in current feed: ₹{cpvBounds.min.toLocaleString("en-IN")} - ₹{cpvBounds.max.toLocaleString("en-IN")}
                </p>
              </div>
            ) : (
              <p className="m-0 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                No per-view opportunities in current results.
              </p>
            )
          ) : null}
        </div>
        <label className="block text-sm text-muted-foreground">
          <span className="mb-1 block">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="value">Highest value (approx.)</option>
          </select>
        </label>
        <div className="space-y-2">
          <p className="m-0 text-sm text-muted-foreground">Category</p>
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
      </div>
    );
  }

  return (
    <section className="stack">
      <div className="card hero">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="title">Home</h1>
            <p className="subtitle">Discover and apply to live opportunities in a focused, scroll-first feed.</p>
          </div>
          <button type="button" className="btn secondary self-start lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
            Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,720px)_300px] lg:items-start lg:justify-center">
        <div className="space-y-4 lg:mx-auto lg:w-full">
          <div className="card space-y-4 p-3 sm:p-4">
            {loading && (
              <div className="list">
                <div className="skeleton skeleton-card" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {!loading && items.length === 0 && (
                <div className="empty">
                  <div className="empty-visual" />
                  No opportunities match your filters.
                </div>
              )}
              {!loading && items.length > 0 && filteredItems.length === 0 ? (
                <div className="empty">
                  <div className="empty-visual" />
                  No opportunities match your compensation filters.
                </div>
              ) : null}
              {filteredItems.map((item) => {
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
        </div>

        <aside className="sticky top-16 hidden lg:block">
          <FiltersPanel />
        </aside>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-modal lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold">Filters</h2>
              <button type="button" className="btn ghost" onClick={() => setMobileFiltersOpen(false)}>
                Done
              </button>
            </div>
            <FiltersPanel />
          </div>
        </div>
      ) : null}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      <style jsx>{`
        .cpv-dual-range {
          position: relative;
          height: 2rem;
        }
        .cpv-dual-range__track {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 0.5rem;
          transform: translateY(-50%);
          border-radius: 999px;
          background: hsl(var(--border));
          opacity: 0.7;
        }
        .cpv-dual-range__active {
          position: absolute;
          top: 50%;
          height: 0.5rem;
          transform: translateY(-50%);
          border-radius: 999px;
          background: hsl(var(--primary));
          opacity: 0.95;
        }
        .cpv-dual-range__input {
          position: absolute;
          inset: 0;
          width: 100%;
          margin: 0;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          pointer-events: none;
        }
        .cpv-dual-range__input::-webkit-slider-runnable-track {
          height: 0.5rem;
          background: transparent;
        }
        .cpv-dual-range__input::-moz-range-track {
          height: 0.5rem;
          background: transparent;
        }
        .cpv-dual-range__input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          margin-top: -6px;
          height: 1.25rem;
          width: 1.25rem;
          border-radius: 999px;
          border: 2px solid hsl(var(--primary));
          background: hsl(var(--background));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }
        .cpv-dual-range__input::-moz-range-thumb {
          pointer-events: auto;
          height: 1.25rem;
          width: 1.25rem;
          border-radius: 999px;
          border: 2px solid hsl(var(--primary));
          background: hsl(var(--background));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }
        .cpv-dual-range__input--min {
          z-index: 2;
        }
        .cpv-dual-range__input--max {
          z-index: 3;
        }
      `}</style>
    </section>
  );
}

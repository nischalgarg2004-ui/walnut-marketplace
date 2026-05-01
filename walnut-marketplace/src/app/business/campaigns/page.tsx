"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkedInCampaignPost, type LinkedInCampaignPostData } from "@/components/design-system/LinkedInCampaignPost";

type RequirementCard = {
  id: string;
  title: string;
  brief: string;
  postText: string | null;
  postImageUrl: string | null;
  status: string;
  createdAt: string;
  spentAmount?: number;
  authorHref?: string;
  criteriaNarrative?: string;
  category?: "UGC" | "CLIPPING";
  clippingSummary?: { sourceCount?: number } | null;
  _count: {
    reactions: number;
    comments: number;
    shareEvents: number;
  };
  viewerReaction: "LIKE" | null;
  business: { brandName: string } | null;
};

export default function BusinessCampaignsPage() {
  const [brandName, setBrandName] = useState("");
  const [items, setItems] = useState<RequirementCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "UGC" | "CLIPPING">("ALL");
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    void (async () => {
      const [prof, req] = await Promise.all([
        fetch("/api/profiles/business"),
        fetch("/api/business/requirements")
      ]);
      const pj = await prof.json();
      const rj = await req.json();
      if (prof.ok && pj.data?.brandName) setBrandName(pj.data.brandName);
      setItems(rj.data ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`campaign-card-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, items]);

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-24 lg:pb-8">
      <div className="mb-6 px-2 lg:px-4">
        <h1 className="title m-0">Campaigns</h1>
        <p className="subtitle m-0 mt-1 text-sm">Your live briefs, rendered in a social posting rhythm.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4 opacity-70">
            <div className="h-40 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 via-transparent to-muted/60" />
            <div className="h-56 rounded-2xl border border-border/40 bg-gradient-to-tr from-muted/20 via-muted/5 to-transparent" />
          </div>
        </aside>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <Link
            href="/business/campaigns/create"
            className="block rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/40 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                {(brandName || "B").slice(0, 1).toUpperCase()}
              </span>
              <div className="flex min-h-11 flex-1 items-center justify-between rounded-full border border-border/70 px-4 text-sm text-muted-foreground">
                <span>Start a post...</span>
                <span aria-hidden>📌</span>
              </div>
            </div>
          </Link>

          <div className="flex justify-end">
            <Link
              href="/business/campaigns/create"
              className="btn primary inline-flex min-h-touch items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              + New
            </Link>
          </div>

        {loading ? (
          <>
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </>
        ) : items.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center text-muted-foreground">
            No campaigns yet. Create your first.
            <div className="mt-4">
              <Link href="/business/campaigns/create" className="btn primary">
                Create campaign
              </Link>
            </div>
          </div>
        ) : (
          items
            .filter((r) => categoryFilter === "ALL" || (r.category ?? "UGC") === categoryFilter)
            .map((r) => {
            const post: LinkedInCampaignPostData = {
              id: r.id,
              title: r.title,
              postText:
                r.category === "CLIPPING" && r.clippingSummary?.sourceCount
                  ? `${r.postText ?? r.brief}\n\nClipping sources: ${r.clippingSummary.sourceCount}`
                  : (r.postText ?? r.brief),
              postImageUrl: r.postImageUrl,
              brandName: r.business?.brandName ?? brandName ?? "Your brand",
              createdAt: r.createdAt,
              reactionCount: r._count.reactions,
              commentCount: r._count.comments,
              shareCount: r._count.shareEvents,
              viewerReaction: r.viewerReaction,
              spentAmount: r.spentAmount ?? 0,
              authorHref: r.authorHref ?? "/business/profile",
              criteriaNarrative: r.criteriaNarrative ?? "",
              postHref: `/business/campaigns?highlight=${r.id}`,
              applyHref: `/business/campaigns/${r.id}`,
              applyLabel: "Apply"
            };
            return (
              <div key={r.id} id={`campaign-card-${r.id}`} className={highlightId === r.id ? "ring-2 ring-primary rounded-2xl" : ""}>
                <LinkedInCampaignPost post={post} />
              </div>
            );
          })
        )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4 opacity-70">
            <div className="h-48 rounded-2xl border border-border/50 bg-gradient-to-bl from-muted/35 via-transparent to-muted/60" />
            <div className="h-52 rounded-2xl border border-border/40 bg-gradient-to-tl from-muted/30 via-muted/10 to-transparent" />
          </div>
        </aside>
      </div>

      <Link
        href="/business/campaigns/create"
        className="btn primary fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full p-0 text-2xl shadow-lg lg:hidden"
        aria-label="New campaign"
      >
        +
      </Link>
      <div className="fixed bottom-4 left-4 z-20 hidden gap-2 rounded-full border border-border bg-card px-2 py-1 shadow-sm sm:flex lg:left-auto lg:right-24">
        {(["ALL", "UGC", "CLIPPING"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

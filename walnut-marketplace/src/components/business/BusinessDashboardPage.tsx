"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";

type TopReel = {
  contractId: string;
  deliverableId: string;
  requirementId: string;
  requirementTitle: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string | null;
  creatorAvatarUrl: string | null;
  previewUrl: string;
  instagramMediaId: string | null;
  views: number;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  updatedAt: string;
};

type HomeNotification = {
  id: string;
  type: "APPLICATION" | "DELIVERABLE" | "REEL_MILESTONE" | "PAYOUT" | "SYSTEM";
  title: string;
  body: string;
  href: string;
  actor: {
    name: string;
    handle: string | null;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  readAt: string | null;
};

type DashboardData = {
  managerName: string;
  businessSummary: {
    brandName: string;
    legalName: string;
    instagramUsername: string | null;
  };
  topReels: TopReel[];
  homeNotifications: HomeNotification[];
};

type BusinessAnalyticsOverview = {
  totalRequirements: number;
  totalApplications: number;
  clipping?: {
    campaignCount: number;
    applicationCount: number;
    sampleSubmitted: number;
    approvedForPublish: number;
    published: number;
    verified: number;
    paid: number;
    rejected: number;
    approvalRate: number;
    publishVerificationRate: number;
    avgTimeToFirstSampleHours: number;
    rejectionMix: {
      hookQuality: number;
      brandSafety: number;
      ctaCompliance: number;
      other: number;
    };
    sourceTypePerformance: Array<{
      sourceType: string;
      campaigns: number;
      applications: number;
      verified: number;
    }>;
  };
};

const GREETINGS = [
  "Welcome back",
  "Great to see you again",
  "Ready for your next big campaign",
  "Let's build momentum today",
  "Your creator engine is waiting"
];

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${value}`;
}

function relativeTime(isoDate: string) {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

type ReelStat = { key: string; label: string; value: number; icon: string };

function buildReelStats(reel: TopReel): ReelStat[] {
  const candidates: ReelStat[] = [
    { key: "likes", label: "Likes", value: reel.likes ?? 0, icon: "♡" },
    { key: "comments", label: "Comments", value: reel.comments ?? 0, icon: "💬" },
    { key: "views", label: "Views", value: reel.views ?? 0, icon: "◉" },
    { key: "shares", label: "Shares", value: reel.shares ?? 0, icon: "↗" }
  ];
  return candidates.filter((item) => item.value > 0);
}

export default function BusinessDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalyticsOverview | null>(null);
  const [error, setError] = useState("");
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/business/dashboard");
      const analyticsRes = await fetch("/api/analytics/overview");
      const json = await res.json();
      const analyticsJson = await analyticsRes.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load");
        return;
      }
      setData(json.data);
      if (analyticsRes.ok) {
        setAnalytics(analyticsJson.data as BusinessAnalyticsOverview);
      }
    })();
  }, []);

  const greeting = useMemo(() => {
    if (!data?.managerName) return GREETINGS[0];
    const dateKey = new Date().toISOString().slice(0, 10);
    const seed = `${data.managerName}-${dateKey}`;
    const score = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return GREETINGS[score % GREETINGS.length];
  }, [data?.managerName]);

  const handleForProfile = useMemo(() => {
    const handle = data?.businessSummary.instagramUsername?.trim();
    if (handle) return `@${handle}`;
    const seed = (data?.managerName || data?.businessSummary.brandName || "business").toLowerCase().replace(/\s+/g, ".");
    return `@${seed}`;
  }, [data?.businessSummary.brandName, data?.businessSummary.instagramUsername, data?.managerName]);

  const fallbackAvatar = useMemo(() => {
    return data?.topReels.find((r) => r.creatorAvatarUrl)?.creatorAvatarUrl ?? null;
  }, [data?.topReels]);

  return (
    <section className="stack">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-6 px-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:px-4">
          <div className="space-y-6">
            <div className="skeleton h-40 rounded-3xl" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="skeleton h-[360px] rounded-3xl" />
              <div className="skeleton h-[360px] rounded-3xl" />
              <div className="skeleton h-[360px] rounded-3xl" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-[420px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-start gap-6 px-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch lg:gap-8 lg:px-4">
          <div className="space-y-6 text-center">
            <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm">
              <p className="m-0 text-sm font-medium tracking-wide text-muted-foreground">{greeting}</p>
              <h1 className="mt-3 m-0 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome back,{" "}
                <span className="font-[var(--font-display)] font-normal text-white">{data.managerName}</span>
              </h1>
              <p className="mt-3 m-0 text-sm text-muted-foreground">
                {data.businessSummary.brandName} creator operations feed, tuned for action.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <h2 className="m-0 text-xl font-semibold tracking-tight text-foreground">Top Performing Reels</h2>
                <Link href="/business/database" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Open database
                </Link>
              </div>
              {data.topReels.length === 0 ? (
                <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border/70 bg-card p-6 text-center">
                  <p className="m-0 text-sm text-muted-foreground">No reel performance data yet.</p>
                  <Link href="/business/campaigns/create" className="btn primary mt-4 inline-flex">
                    Publish your first reel campaign
                  </Link>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-4xl snap-x snap-mandatory justify-center gap-4 overflow-x-auto pb-2">
                  {data.topReels.map((reel) => (
                    (() => {
                      const reelHref = reel.previewUrl?.startsWith("http") ? reel.previewUrl : `/business/deals/${reel.contractId}`;
                      const stats = buildReelStats(reel);
                      return (
                    <a
                      key={reel.deliverableId}
                      href={reelHref}
                      target={reelHref.startsWith("http") ? "_blank" : undefined}
                      rel={reelHref.startsWith("http") ? "noreferrer" : undefined}
                      className="group relative h-[360px] min-w-[220px] snap-start overflow-hidden rounded-3xl border border-border/70 bg-black shadow-sm"
                    >
                      {failedPreviews[reel.deliverableId] ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-900 px-4 text-center text-white">
                          <div className="size-20 overflow-hidden rounded-full border border-white/30">
                            {reel.creatorAvatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={reel.creatorAvatarUrl} alt={reel.creatorName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-xl font-semibold">
                                {reel.creatorName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <p className="m-0 text-xs font-semibold">{reel.creatorHandle ? `@${reel.creatorHandle}` : reel.creatorName}</p>
                          <p className="m-0 text-[11px] text-zinc-300">{reel.requirementTitle}</p>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reel.previewUrl}
                          alt={`${reel.requirementTitle} reel preview`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() =>
                            setFailedPreviews((prev) => ({
                              ...prev,
                              [reel.deliverableId]: true
                            }))
                          }
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white transition-opacity duration-200 group-hover:opacity-0">
                        <p className="m-0 truncate text-xs font-semibold">
                          {reel.creatorHandle ? `@${reel.creatorHandle}` : reel.creatorName}
                        </p>
                        <p className="m-0 truncate text-[11px] opacity-85">{reel.requirementTitle}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {stats.length > 0 ? (
                          <div className="grid w-full max-w-[170px] grid-cols-2 gap-x-4 gap-y-3 text-center text-white">
                            {stats.map((stat) => (
                              <div key={stat.key} className="flex flex-col items-center gap-1">
                                <span className="text-lg leading-none">{stat.icon}</span>
                                <span className="text-sm font-semibold leading-none">{compactNumber(stat.value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 text-xs font-medium text-white/90">No insights yet</p>
                        )}
                      </div>
                    </a>
                      );
                    })()
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="w-full rounded-2xl border border-border/50 bg-[#090d14] p-4 text-left shadow-sm lg:h-full">
            <div className="mb-4 flex items-center justify-center gap-3 border-b border-white/10 pb-4">
              <div className="size-11 overflow-hidden rounded-full bg-zinc-800">
                {fallbackAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fallbackAvatar} alt={data.managerName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-300">
                    {data.managerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left">
                <p className="m-0 text-sm font-semibold text-white">{handleForProfile.replace("@", "")}</p>
                <p className="m-0 text-xs text-zinc-400">{data.businessSummary.brandName}</p>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-start gap-2">
              <h2 className="m-0 text-sm font-semibold tracking-wide text-white">Notifications</h2>
              <span className="text-xs text-zinc-400">{data.homeNotifications.length}</span>
            </div>

            {data.homeNotifications.length === 0 ? (
              <p className="m-0 text-sm text-zinc-400">No notifications yet.</p>
            ) : (
              <ul className="m-0 list-none space-y-1.5 p-0">
                {data.homeNotifications.map((n) => (
                  <li key={n.id}>
                    {n.href.startsWith("http") ? (
                      <a
                        href={n.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl px-2 py-2 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex items-center justify-start gap-2 text-left">
                          <div className="size-10 shrink-0 overflow-hidden rounded-full bg-zinc-700/60">
                            {n.actor?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={n.actor.avatarUrl} alt={n.actor.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-300">
                                {n.actor?.name?.slice(0, 2).toUpperCase() ?? "ON"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px] flex-1 text-left">
                            <p className="m-0 text-sm font-medium leading-snug text-white">{n.title}</p>
                            <p className="m-0 mt-0.5 text-xs leading-snug text-zinc-400">{n.body}</p>
                            <p className="m-0 mt-0.5 text-[11px] text-zinc-500">{relativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </a>
                    ) : (
                      <Link
                        href={n.href as Route}
                        className="block rounded-xl px-2 py-2 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                      <div className="flex items-center justify-start gap-2 text-left">
                        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-zinc-700/60">
                          {n.actor?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={n.actor.avatarUrl} alt={n.actor.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-300">
                              {n.actor?.name?.slice(0, 2).toUpperCase() ?? "ON"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[220px] flex-1 text-left">
                          <p className="m-0 text-sm font-medium leading-snug text-white">{n.title}</p>
                          <p className="m-0 mt-0.5 text-xs leading-snug text-zinc-400">{n.body}</p>
                          <p className="m-0 mt-0.5 text-[11px] text-zinc-500">{relativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {analytics?.clipping ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-zinc-300">Clipping Ops</p>
                  <Link href="/business/campaigns" className="text-[11px] text-zinc-400 hover:text-white">
                    View campaigns
                  </Link>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="m-0 text-[11px] text-zinc-400">Approval rate</p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-white">{analytics.clipping.approvalRate}%</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="m-0 text-[11px] text-zinc-400">Publish verify</p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-white">
                      {analytics.clipping.publishVerificationRate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="m-0 text-[11px] text-zinc-400">Avg sample time</p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-white">
                      {analytics.clipping.avgTimeToFirstSampleHours}h
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="m-0 text-[11px] text-zinc-400">Rejections</p>
                    <p className="m-0 mt-0.5 text-sm font-semibold text-white">{analytics.clipping.rejected}</p>
                  </div>
                </div>
                {analytics.clipping.sourceTypePerformance.length > 0 ? (
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <p className="m-0 text-[11px] text-zinc-400">Top source mix</p>
                    <div className="mt-1 space-y-1">
                      {analytics.clipping.sourceTypePerformance.slice(0, 3).map((row) => (
                        <p key={row.sourceType} className="m-0 text-[11px] text-zinc-300">
                          {row.sourceType}: {row.applications} apps, {row.verified} verified
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
}

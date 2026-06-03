"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type InsightsMedia = {
  id: string;
  permalink?: string;
  mediaType?: string;
  timestamp?: string;
};

type InsightsRow = {
  name: string;
  period?: string;
  values?: Array<{ value?: number }>;
  title?: string;
  description?: string;
};

type InsightsDiagnostics = {
  requestedMetrics?: string[];
  returnedMetrics?: string[];
  unsupportedMetrics?: string[];
  classification?:
    | "OK"
    | "NO_DATA_YET"
    | "UNSUPPORTED_FOR_MEDIA_TYPE"
    | "TOKEN_SCOPE_GAP"
    | "TOKEN_INVALID"
    | "API_ERROR";
  status?: "COMPLETE" | "PARTIAL" | "NO_DATA" | "ERROR";
  errorMessage?: string;
};

type InsightsAccount = {
  instagramUserId: string;
  username: string;
  accountType: string;
  followerCount?: number;
  postCount?: number;
};

type InsightsResponse = {
  data?: {
    account: InsightsAccount;
    latestMedia: InsightsMedia[];
    selectedMediaId: string | null;
    selectedMediaPermalink: string | null;
    selectedMediaType: string | null;
    insights: InsightsRow[];
    diagnostics: InsightsDiagnostics;
    tokenRefreshed: boolean;
    fetchedAt: string;
  };
  error?: string;
};

function metricLabel(name: string): string {
  return name
    .split("_")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function pickValue(row: InsightsRow): number | null {
  const v = row.values?.[0]?.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function formatMediaOption(media: InsightsMedia, index: number): string {
  const kind = media.mediaType ?? "MEDIA";
  const when = media.timestamp ? new Date(media.timestamp).toLocaleDateString() : null;
  const suffix = when ? ` · ${when}` : "";
  return `${index + 1}. ${kind}${suffix}`;
}

function statusBanner(diagnostics: InsightsDiagnostics | undefined, errorText: string | null) {
  if (errorText) {
    return { tone: "error" as const, text: errorText };
  }
  if (!diagnostics) return null;
  if (diagnostics.classification === "TOKEN_SCOPE_GAP") {
    return {
      tone: "error" as const,
      text: "This Instagram account did not grant instagram_business_manage_insights. Reconnect Instagram and approve the insights permission."
    };
  }
  if (diagnostics.classification === "TOKEN_INVALID") {
    return {
      tone: "error" as const,
      text: "Instagram authorization is no longer valid. Reconnect Instagram and try again."
    };
  }
  if (diagnostics.classification === "UNSUPPORTED_FOR_MEDIA_TYPE") {
    return {
      tone: "info" as const,
      text: "This media type does not support all the requested metrics. Showing supported metrics only."
    };
  }
  if (diagnostics.classification === "NO_DATA_YET") {
    return {
      tone: "info" as const,
      text: "No insights are available yet for this media. Instagram needs time to aggregate metrics after publishing."
    };
  }
  if (diagnostics.classification === "API_ERROR") {
    return {
      tone: "error" as const,
      text: diagnostics.errorMessage ?? "Instagram Graph API returned an error fetching insights. Please retry."
    };
  }
  return null;
}

export default function CreatorInstagramInsightsCard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [account, setAccount] = useState<InsightsAccount | null>(null);
  const [media, setMedia] = useState<InsightsMedia[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaPermalink, setSelectedMediaPermalink] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsRow[]>([]);
  const [diagnostics, setDiagnostics] = useState<InsightsDiagnostics | undefined>(undefined);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const applyResponse = useCallback((body: InsightsResponse) => {
    const data = body.data;
    if (!data) return;
    setAccount(data.account);
    setMedia(data.latestMedia ?? []);
    setSelectedMediaId(data.selectedMediaId ?? null);
    setSelectedMediaPermalink(data.selectedMediaPermalink ?? null);
    setSelectedMediaType(data.selectedMediaType ?? null);
    setInsights(data.insights ?? []);
    setDiagnostics(data.diagnostics);
    setFetchedAt(data.fetchedAt ?? null);
  }, []);

  const fetchInsights = useCallback(
    async (mediaId?: string | null) => {
      setErrorText(null);
      const url = mediaId
        ? `/api/creator/insights?mediaId=${encodeURIComponent(mediaId)}`
        : "/api/creator/insights";
      const res = await fetch(url, { method: "GET", credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as InsightsResponse;
      if (!res.ok) {
        const code = body.error ?? `Request failed (${res.status})`;
        if (code === "INSTAGRAM_NOT_CONNECTED") {
          setErrorText("Connect your Instagram professional account to view insights.");
        } else if (code === "INSTAGRAM_TOKEN_INVALID") {
          setErrorText("Instagram authorization is no longer valid. Reconnect Instagram and try again.");
        } else {
          setErrorText(code);
        }
        return;
      }
      applyResponse(body);
    },
    [applyResponse]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await fetchInsights();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchInsights]);

  const banner = useMemo(() => statusBanner(diagnostics, errorText), [diagnostics, errorText]);

  async function onMediaChange(nextId: string) {
    setSelectedMediaId(nextId);
    setRefreshing(true);
    try {
      await fetchInsights(nextId);
    } finally {
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await fetchInsights(selectedMediaId);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="card" aria-labelledby="creator-insights-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="creator-insights-heading" className="section-title m-0">
            Instagram insights (live)
          </h2>
          <p className="muted text-sm mt-1 max-w-xl">
            Read-only insights for your own Instagram professional account. Loads recent media via
            <code className="mx-1">GET /me/media</code>
            and metrics via
            <code className="mx-1">GET /&#123;media-id&#125;/insights</code>
            on
            <code className="mx-1">graph.instagram.com</code>
            using the
            <code className="mx-1">instagram_business_manage_insights</code>
            permission you granted at sign-in.
          </p>
        </div>
        <button
          type="button"
          className="btn secondary shrink-0"
          onClick={() => void onRefresh()}
          disabled={loading || refreshing || media.length === 0}
        >
          {refreshing ? "Refreshing…" : "Refresh insights"}
        </button>
      </div>

      {loading ? (
        <p className="help mt-4">Loading Instagram insights…</p>
      ) : (
        <>
          {account ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Connected Instagram account">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Handle</dt>
                <dd className="mt-1 text-foreground">@{account.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account type</dt>
                <dd className="mt-1 text-foreground">{account.accountType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Followers · Posts
                </dt>
                <dd className="mt-1 tabular-nums text-foreground">
                  {(account.followerCount ?? 0).toLocaleString()} · {(account.postCount ?? 0).toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 stack" style={{ gap: "0.25rem" }}>
              <span className="text-sm font-medium text-foreground">Pick a recent media item</span>
              <select
                value={selectedMediaId ?? ""}
                onChange={(e) => void onMediaChange(e.target.value)}
                disabled={refreshing || media.length === 0}
              >
                {media.length === 0 ? (
                  <option value="">No media available</option>
                ) : (
                  media.map((m, i) => (
                    <option key={m.id} value={m.id}>
                      {formatMediaOption(m, i)}
                    </option>
                  ))
                )}
              </select>
            </label>
            {selectedMediaPermalink ? (
              <a
                href={selectedMediaPermalink}
                target="_blank"
                rel="noreferrer"
                className="btn ghost shrink-0"
              >
                Open on Instagram
              </a>
            ) : null}
          </div>

          {banner ? (
            <p
              className={`mt-4 text-sm ${banner.tone === "error" ? "text-destructive" : "text-foreground"}`}
              role="status"
            >
              {banner.text}
            </p>
          ) : null}

          {insights.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <caption className="sr-only">Instagram insights for the selected media</caption>
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      Metric
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.map((row) => {
                    const value = pickValue(row);
                    return (
                      <tr key={row.name} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">
                          <span className="font-medium">{row.title ?? metricLabel(row.name)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{row.name}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{row.period ?? "lifetime"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {value !== null ? value.toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !banner ? (
            <p className="help mt-4">
              Pick a media item and click Refresh insights to load <code>/&#123;media-id&#125;/insights</code>.
            </p>
          ) : null}

          {diagnostics?.unsupportedMetrics && diagnostics.unsupportedMetrics.length > 0 ? (
            <p className="help mt-3">
              Unsupported for this media type ({selectedMediaType ?? "unknown"}):{" "}
              {diagnostics.unsupportedMetrics.join(", ")}.
            </p>
          ) : null}

          <p className="help mt-3">
            {fetchedAt ? <>Fetched at {new Date(fetchedAt).toLocaleString()}. </> : null}
            All data is read on behalf of your connected creator account and never shared with third parties.
          </p>
        </>
      )}
    </div>
  );
}

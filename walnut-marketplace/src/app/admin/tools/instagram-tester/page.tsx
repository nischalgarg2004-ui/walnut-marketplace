"use client";

import { FormEvent, useMemo, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type ProbeResponse = {
  ok?: boolean;
  classification?: string;
  error?: string;
  timestamp?: string;
  checks?: {
    me?: { ok?: boolean; latencyMs?: number; httpStatus?: number; error?: { message?: string } };
    mediaList?: {
      ok?: boolean;
      latencyMs?: number;
      httpStatus?: number;
      count?: number;
      sampleMediaIds?: string[];
      error?: { message?: string };
    };
    mediaSelection?: { selectedMediaId?: string; selectionMode?: string };
    insights?: {
      ok?: boolean;
      latencyMs?: number;
      httpStatus?: number;
      metricRequest?: string[];
      metricsReturned?: string[];
      error?: { message?: string };
    };
  };
  uiHints?: { remediation?: string[]; docsLinks?: string[] };
  target?: { creatorProfileId?: string; instagramUsername?: string; instagramUserId?: string };
  token?: { present?: boolean; expiresAt?: string; refreshed?: boolean; refreshError?: string };
};

const DEFAULT_METRICS = "reach,likes,comments,saved,shares,views";

export default function InstagramTesterPage() {
  const [creatorProfileId, setCreatorProfileId] = useState("");
  const [creatorUserId, setCreatorUserId] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [mediaSelectionMode, setMediaSelectionMode] = useState<"latest_media" | "manual_media_id" | "permalink_resolution">(
    "latest_media"
  );
  const [manualMediaId, setManualMediaId] = useState("");
  const [permalink, setPermalink] = useState("");
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProbeResponse | null>(null);

  const canSubmit = useMemo(() => {
    if (mediaSelectionMode === "manual_media_id" && !manualMediaId.trim()) return false;
    if (mediaSelectionMode === "permalink_resolution" && !permalink.trim()) return false;
    return true;
  }, [manualMediaId, mediaSelectionMode, permalink]);

  async function runProbe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/tools/instagram-tester/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorProfileId: creatorProfileId.trim() || undefined,
        creatorUserId: creatorUserId.trim() || undefined,
        instagramUsername: instagramUsername.trim() || undefined,
        mediaSelectionMode,
        manualMediaId: manualMediaId.trim() || undefined,
        permalink: permalink.trim() || undefined,
        metrics: metrics
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      })
    });
    const body = (await res.json()) as ProbeResponse;
    setResult(body);
    setSubmitting(false);
  }

  return (
    <PageScaffold
      eyebrow="Admin Tool"
      title="Instagram live-domain tester"
      description="Graph probe for deployed-domain Instagram Login capability checks (`/me`, `/me/media`, and media insights)."
    >
      <PagePanel>
        <form className="stack" onSubmit={runProbe}>
          <div className="layout-grid three">
            <input
              value={creatorProfileId}
              onChange={(e) => setCreatorProfileId(e.target.value)}
              placeholder="Creator profile id (optional)"
            />
            <input value={creatorUserId} onChange={(e) => setCreatorUserId(e.target.value)} placeholder="Creator user id (optional)" />
            <input
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value)}
              placeholder="Instagram username (optional)"
            />
          </div>
          <div className="layout-grid three">
            <select value={mediaSelectionMode} onChange={(e) => setMediaSelectionMode(e.target.value as typeof mediaSelectionMode)}>
              <option value="latest_media">Latest media</option>
              <option value="manual_media_id">Manual media id</option>
              <option value="permalink_resolution">Resolve from permalink</option>
            </select>
            <input
              value={manualMediaId}
              onChange={(e) => setManualMediaId(e.target.value)}
              placeholder="Manual media id"
              disabled={mediaSelectionMode !== "manual_media_id"}
            />
            <input
              value={permalink}
              onChange={(e) => setPermalink(e.target.value)}
              placeholder="Permalink URL"
              disabled={mediaSelectionMode !== "permalink_resolution"}
            />
          </div>
          <input value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder="metrics comma list (reach,likes,...)" />
          <div className="row">
            <button className="btn primary" disabled={submitting || !canSubmit} type="submit">
              {submitting ? "Running probe..." : "Run Probe"}
            </button>
          </div>
        </form>
      </PagePanel>

      {result ? (
        <PagePanel title="Probe result" className="stack">
          <p className="section-subtitle">
            Status: <strong>{result.classification ?? (result.error ? "ERROR" : "UNKNOWN")}</strong>
          </p>
          {result.error ? <p className="muted">{result.error}</p> : null}
          {result.target ? (
            <p className="muted">
              Target: {result.target.instagramUsername ?? "n/a"} ({result.target.creatorProfileId ?? "no profile id"})
            </p>
          ) : null}
          {result.token ? (
            <p className="muted">
              Token present: {String(Boolean(result.token.present))}; refreshed: {String(Boolean(result.token.refreshed))}
              {result.token.expiresAt ? `; expires: ${result.token.expiresAt}` : ""}
            </p>
          ) : null}

          <div className="layout-grid three">
            <div className="rounded-xl border border-border p-3">
              <p className="m-0 text-sm font-medium">/me</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                ok={String(Boolean(result.checks?.me?.ok))} | http={result.checks?.me?.httpStatus ?? "-"} |{" "}
                {result.checks?.me?.latencyMs ?? 0}ms
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="m-0 text-sm font-medium">/me/media</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                ok={String(Boolean(result.checks?.mediaList?.ok))} | count={result.checks?.mediaList?.count ?? 0} |{" "}
                {result.checks?.mediaList?.latencyMs ?? 0}ms
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="m-0 text-sm font-medium">/{`{media-id}`}/insights</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                ok={String(Boolean(result.checks?.insights?.ok))} | returned=
                {result.checks?.insights?.metricsReturned?.join(", ") || "none"} | {result.checks?.insights?.latencyMs ?? 0}ms
              </p>
            </div>
          </div>
          {result.uiHints?.remediation?.length ? (
            <ul className="clean">
              {result.uiHints.remediation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">Raw response</summary>
            <pre className="mt-2 overflow-auto rounded-md border border-border p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </PagePanel>
      ) : null}
    </PageScaffold>
  );
}


"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { DealTimeline, type TimelineStep } from "@/components/design-system/DealTimeline";
import Toast from "@/components/ui/Toast";

type DealPayload = {
  id: string;
  status: string;
  requirement: { id: string; title: string; business?: { brandName?: string } };
  contract: null | {
    id: string;
    status: string;
    acceptedAt: string | null;
    deliverables: Array<{
      id: string;
      status: string;
      externalUrl: string | null;
      instagramMediaId?: string | null;
      fileUrl: string;
      slotIndex: number | null;
      expectedKind: "REEL" | "STORY" | "POST" | "MIXED" | null;
      feedback: string | null;
    }>;
    payouts: Array<{ id: string; status: string }>;
    barterShipment: null | { status: string };
    performanceReport: null | {
      viewsCount: number;
      status: string;
      source: string;
    };
    metricSnapshots: Array<{ capturedAt: string; views: number; source: string }>;
  };
};

function buildTimeline(app: DealPayload): TimelineStep[] {
  const steps: TimelineStep[] = [
    { id: "app", label: "Application", description: `Status: ${app.status}`, state: "complete" }
  ];

  if (!app.contract) {
    steps.push({
      id: "deal",
      label: "Deal",
      description: "No contract yet—waiting on the brand.",
      state: "upcoming"
    });
    return steps;
  }

  const c = app.contract;
  const contractDone = c.status === "COMPLETED" || c.status === "CANCELLED";
  steps.push({
    id: "contract",
    label: "Contract",
    description: c.acceptedAt ? `Active · ${c.status}` : `Pending acceptance · ${c.status}`,
    state: c.acceptedAt ? (contractDone ? "complete" : "current") : "current"
  });

  const hasDeliverables = c.deliverables.length > 0;
  const allDeliverablesApproved = hasDeliverables && c.deliverables.every((d) => d.status === "APPROVED");
  steps.push({
    id: "deliverables",
    label: "Deliverables",
    description: hasDeliverables
      ? `${c.deliverables.length} submission(s)`
      : "Submit deliverables when the brand is ready.",
    state: allDeliverablesApproved ? "complete" : hasDeliverables ? "current" : "upcoming"
  });

  const payout = c.payouts[0];
  steps.push({
    id: "payout",
    label: "Payout",
    description: payout ? `Status: ${payout.status}` : "Shown when a payout is scheduled.",
    state: payout?.status === "PAID" ? "complete" : payout ? "current" : "upcoming"
  });

  return steps;
}

export default function CreatorDealDetailPage() {
  const params = useParams();
  const contractId = params.contractId as string;
  const [data, setData] = useState<DealPayload | null>(null);
  const [reelUrl, setReelUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingSlotId, setSubmittingSlotId] = useState<string | null>(null);
  const [slotUrl, setSlotUrl] = useState<Record<string, string>>({});
  const [markingReceived, setMarkingReceived] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  async function loadDeal() {
    const res = await fetch(`/api/creator/deals/${contractId}`);
    const json = await res.json();
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not load deal", type: "error" });
      return;
    }
    setData(json.data);
    const d = json.data as DealPayload;
    const linked = d.contract?.deliverables?.find((x) => x.externalUrl?.trim())?.externalUrl;
    setReelUrl(linked ?? "");
    setSlotUrl(
      Object.fromEntries(
        (d.contract?.deliverables ?? []).map((x) => [x.id, x.externalUrl?.trim() || x.fileUrl?.trim() || ""])
      )
    );
  }

  useEffect(() => {
    loadDeal().catch(() => setToast({ message: "Could not load deal", type: "error" }));
  }, [contractId]);

  const steps = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  async function saveReelLink(e: FormEvent) {
    e.preventDefault();
    if (!data?.contract || data.contract.status !== "ACTIVE") {
      setToast({ message: "Reel link can only be saved for an active contract.", type: "error" });
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/creator/deals/${contractId}/reel-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reelUrl })
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not save link", type: "error" });
      return;
    }
    setToast({ message: "Reel link saved and views refreshed.", type: "success" });
    await loadDeal();
  }

  async function refreshMetrics() {
    if (!data?.contract || data.contract.status !== "ACTIVE") {
      setToast({ message: "Metrics refresh is only available for active contracts.", type: "error" });
      return;
    }
    setRefreshing(true);
    const res = await fetch(`/api/creator/deals/${contractId}/metrics/refresh`, { method: "POST" });
    const json = await res.json();
    setRefreshing(false);
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not refresh views", type: "error" });
      return;
    }
    setToast({
      message: json.data.message
        ? `${json.data.message} (${json.data.views.toLocaleString()} views)`
        : `Updated: ${json.data.views.toLocaleString()} views (${json.data.source})`,
      type: "success"
    });
    await loadDeal();
  }

  async function confirmBarterReceived() {
    setMarkingReceived(true);
    const res = await fetch(`/api/creator/deals/${contractId}/barter-received`, { method: "POST" });
    const json = await res.json();
    setMarkingReceived(false);
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not confirm receipt", type: "error" });
      return;
    }
    setToast({ message: "Product received confirmation sent.", type: "success" });
    await loadDeal();
  }

  async function submitSlot(deliverableId: string) {
    const url = slotUrl[deliverableId]?.trim();
    if (!url) {
      setToast({ message: "Enter a valid URL/file link for this deliverable slot.", type: "error" });
      return;
    }
    setSubmittingSlotId(deliverableId);
    const res = await fetch("/api/deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId, fileUrl: url, fileType: "link", deliverableId })
    });
    const json = await res.json();
    setSubmittingSlotId(null);
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not submit deliverable", type: "error" });
      return;
    }
    setToast({ message: "Deliverable submitted for review.", type: "success" });
    await loadDeal();
  }

  if (!data) {
    return (
      <section className="stack">
        <div className="skeleton skeleton-card" />
      </section>
    );
  }

  const brand = data.requirement.business?.brandName ?? "Brand";
  const c = data.contract;
  const lastSnap = c?.metricSnapshots?.[0];
  const report = c?.performanceReport;
  const resolvedMediaId = c?.deliverables.find((d) => d.instagramMediaId)?.instagramMediaId ?? null;

  return (
    <section className="stack">
      <div className="card hero">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{brand}</p>
        <h1 className="title">{data.requirement.title}</h1>
        <p className="subtitle">Deal timeline and next steps for this collaboration.</p>
        <Link className="btn ghost" href="/creator/deals">
          Back to deals
        </Link>
      </div>

      <div className="card">
        <h2 className="section-title">Progress</h2>
        <DealTimeline steps={steps} role="creator" />
      </div>

      {c && c.status === "ACTIVE" && (
        <div className="card">
          <h2 className="section-title">Published reel &amp; views</h2>
          <p className="muted text-sm mb-4">
            Paste the public Instagram reel (or post) URL for this campaign. View counts are fetched via Instagram Graph
            API from your connected account and may lag behind in-app analytics. Used as a basis for view-based payouts
            when your brand uses CPV.
          </p>
          <form onSubmit={(e) => void saveReelLink(e)} className="stack" style={{ gap: "0.75rem" }}>
            <label className="stack" style={{ gap: "0.25rem" }}>
              <span className="text-sm font-medium">Reel URL</span>
              <input
                type="url"
                value={reelUrl}
                onChange={(e) => setReelUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/…"
                autoComplete="off"
              />
            </label>
            <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save link &amp; refresh views"}
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={refreshing}
                onClick={() => void refreshMetrics()}
              >
                {refreshing ? "Refreshing…" : "Refresh views only"}
              </button>
            </div>
          </form>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm">
              <strong>Latest views (stored):</strong>{" "}
              {report ? (
                <>
                  {report.viewsCount.toLocaleString()}{" "}
                  <span className="muted">
                    · status {report.status} · source {report.source}
                  </span>
                </>
              ) : (
                <span className="muted">No metrics yet—save a reel URL or refresh.</span>
              )}
            </p>
            <p className="muted text-sm mt-1">
              Media ID resolution:{" "}
              {resolvedMediaId ? (
                <>
                  <code>{resolvedMediaId}</code> · Graph-linked
                </>
              ) : (
                "Not resolved yet (save a valid Instagram permalink from this connected account)."
              )}
            </p>
            {lastSnap && (
              <p className="muted text-sm mt-1">
                Last capture: {new Date(lastSnap.capturedAt).toLocaleString()} · {lastSnap.views.toLocaleString()} views (
                {lastSnap.source})
              </p>
            )}
            <p className="muted text-xs mt-2">
              Creator production validation path: use this deal refresh and the profile insights section on{" "}
              <Link href="/creator/profile" className="underline underline-offset-2">
                /creator/profile
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {c && c.status === "ACTIVE" && (
        <div className="card">
          <h2 className="section-title">Open deal workspace</h2>
          {c.barterShipment ? (
            <div className="mb-4 rounded-lg border border-border p-3">
              <p className="m-0 text-sm">
                Barter shipment: <strong>{c.barterShipment.status}</strong>
              </p>
              {c.barterShipment.status !== "RECEIVED" ? (
                <button className="btn secondary mt-2" disabled={markingReceived} onClick={() => void confirmBarterReceived()}>
                  {markingReceived ? "Updating..." : "Confirm product received"}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="list">
            {c.deliverables.map((d, idx) => (
              <article key={d.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 font-medium">
                    Deliverable {idx + 1}
                    {d.expectedKind ? ` · ${d.expectedKind}` : ""}
                  </p>
                  <span className={`status ${d.status.toLowerCase()}`}>{d.status}</span>
                </div>
                {d.feedback ? <p className="muted text-sm mt-2">Feedback: {d.feedback}</p> : null}
                {d.externalUrl ? (
                  <p className="muted text-sm mt-2">
                    Current:{" "}
                    <a href={d.externalUrl} target="_blank" rel="noreferrer">
                      {d.externalUrl}
                    </a>
                  </p>
                ) : null}
                {(d.status === "PENDING" || d.status === "REVISION_REQUESTED") && (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      type="url"
                      value={slotUrl[d.id] ?? ""}
                      onChange={(e) => setSlotUrl((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      placeholder="Paste media URL or hosted file URL"
                    />
                    <button
                      className="btn primary w-fit"
                      disabled={submittingSlotId === d.id}
                      onClick={() => void submitSlot(d.id)}
                    >
                      {submittingSlotId === d.id ? "Submitting..." : "Submit deliverable"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="row">
        <Link className="btn primary" href={`/creator/opportunity/${data.requirement.id}`}>
          Open opportunity
        </Link>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

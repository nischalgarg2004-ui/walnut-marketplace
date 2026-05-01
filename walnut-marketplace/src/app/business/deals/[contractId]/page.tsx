"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { labelDeliverableSlotRows } from "@/lib/deliverable-slots";

type DealDetail = {
  id: string;
  status: string;
  acceptedAt: string | null;
  requirement: { title: string; business?: { brandName?: string }; compensation?: { hasBarter: boolean } | null };
  creator: { fullName: string; instagramUsername: string | null; instagramHandle: string | null; followerCount: number };
  deliverables: Array<{
    id: string;
    slotIndex: number | null;
    expectedKind: "REEL" | "STORY" | "POST" | "MIXED" | null;
    status: string;
    externalUrl: string | null;
    fileUrl: string;
    feedback: string | null;
  }>;
  barterShipment: null | { status: string; shippedAt: string | null; receivedAt: string | null; trackingHint: string | null };
  performanceReport: null | { viewsCount: number; status: string; source: string };
  payouts: Array<{ id: string; status: string; netAmount: string }>;
};

export default function BusinessDealDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const [data, setData] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingHint, setTrackingHint] = useState("");
  const [shipmentBusy, setShipmentBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [payoutCheck, setPayoutCheck] = useState<string[]>([]);

  async function load() {
    const res = await fetch(`/api/business/deals/${contractId}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return;
    setData(json.data);
    setTrackingHint(json.data?.barterShipment?.trackingHint ?? "");
  }

  useEffect(() => {
    void load();
  }, [contractId]);

  const slotRows = useMemo(() => {
    if (!data) return [];
    const raw = data.deliverables.map((d) => ({
      kind:
        d.expectedKind === "REEL" || d.expectedKind === "STORY" || d.expectedKind === "POST"
          ? d.expectedKind
          : "POST",
      note: undefined
    }));
    const labels = labelDeliverableSlotRows(raw);
    return data.deliverables.map((d, i) => ({ ...d, label: labels[i]?.label ?? `Deliverable ${i + 1}` }));
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const checks: string[] = [];
    if (data.status !== "ACTIVE") checks.push("Contract must be ACTIVE");
    if (slotRows.some((d) => d.status !== "APPROVED" && d.status !== "PUBLISHED")) {
      checks.push("All deliverables must be approved");
    }
    if (data.requirement.compensation?.hasBarter && data.barterShipment?.status !== "RECEIVED") {
      checks.push("Barter item must be marked RECEIVED");
    }
    if (!data.performanceReport || data.performanceReport.status !== "VERIFIED") {
      checks.push("Metrics should be VERIFIED");
    }
    setPayoutCheck(checks);
  }, [data, slotRows]);

  async function reviewDeliverable(id: string, action: "APPROVE" | "REQUEST_REVISION") {
    await fetch(`/api/deliverables/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        feedback: action === "REQUEST_REVISION" ? "Please update this slot per brief." : undefined
      })
    });
    await load();
  }

  async function markShipped() {
    setShipmentBusy(true);
    await fetch(`/api/business/deals/${contractId}/shipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_SHIPPED", trackingHint })
    });
    setShipmentBusy(false);
    await load();
  }

  async function setContractStatus(status: "COMPLETED" | "CANCELLED" | "DISPUTED") {
    setStatusBusy(true);
    await fetch(`/api/business/deals/${contractId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setStatusBusy(false);
    await load();
  }

  if (loading || !data) {
    return (
      <section className="stack">
        <div className="skeleton skeleton-card" />
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="card hero">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {data.requirement.business?.brandName ?? "Brand"} · Deal workspace
        </p>
        <h1 className="title">{data.requirement.title}</h1>
        <p className="subtitle">
          Creator {data.creator.fullName}
          {data.creator.instagramUsername || data.creator.instagramHandle
            ? ` (@${data.creator.instagramUsername ?? data.creator.instagramHandle})`
            : ""}
        </p>
        <Link href="/business/database" className="btn ghost">
          Back to database manager
        </Link>
      </div>

      <div className="card">
        <h2 className="section-title">Contract controls</h2>
        <p className="muted text-sm">Status: {data.status}</p>
        <div className="row mb-3">
          <button className="btn primary" disabled={statusBusy} onClick={() => void setContractStatus("COMPLETED")}>
            Mark completed
          </button>
          <button className="btn secondary" disabled={statusBusy} onClick={() => void setContractStatus("DISPUTED")}>
            Mark disputed
          </button>
          <button className="btn danger" disabled={statusBusy} onClick={() => void setContractStatus("CANCELLED")}>
            Cancel contract
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Shipment</h2>
        {!data.barterShipment ? (
          <p className="muted">No barter shipment in this deal.</p>
        ) : (
          <div className="stack">
            <p className="muted">Status: {data.barterShipment.status}</p>
            <input
              value={trackingHint}
              onChange={(e) => setTrackingHint(e.target.value)}
              placeholder="Tracking hint / courier / note"
            />
            <button className="btn secondary" disabled={shipmentBusy} onClick={() => void markShipped()}>
              {shipmentBusy ? "Updating..." : "Mark shipped"}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Deliverables</h2>
        <div className="list">
          {slotRows.map((d) => (
            <article key={d.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="m-0 font-medium">{d.label}</p>
                <span className={`status ${d.status.toLowerCase()}`}>{d.status}</span>
              </div>
              <p className="muted mt-2 text-sm">
                {d.externalUrl ? (
                  <a href={d.externalUrl} target="_blank" rel="noreferrer">
                    {d.externalUrl}
                  </a>
                ) : d.fileUrl ? (
                  <a href={d.fileUrl} target="_blank" rel="noreferrer">
                    {d.fileUrl}
                  </a>
                ) : (
                  "No asset submitted"
                )}
              </p>
              {d.feedback ? <p className="muted text-sm">Feedback: {d.feedback}</p> : null}
              <div className="row mt-2">
                <button className="btn primary" onClick={() => void reviewDeliverable(d.id, "APPROVE")}>
                  Approve
                </button>
                <button className="btn secondary" onClick={() => void reviewDeliverable(d.id, "REQUEST_REVISION")}>
                  Request revision
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Payout readiness</h2>
        {payoutCheck.length === 0 ? (
          <p className="text-sm text-emerald-700">Ready to trigger payout.</p>
        ) : (
          <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {payoutCheck.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


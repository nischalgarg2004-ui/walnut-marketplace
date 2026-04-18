"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type BoardRow = {
  contractId: string;
  requirementTitle: string;
  creatorName: string;
  instagramUsername: string | null;
  followerCount: number;
  contractStatus: string;
  applicationStatus: string;
  acceptedAt: string | null;
  deliveryEtaAt: string | null;
  barter: null | {
    status: string;
    trackingHint: string | null;
    shippedAt: string | null;
    receivedAt: string | null;
  };
  latestDeliverable: null | {
    id: string;
    status: string;
    contentSource: string;
    externalUrl: string | null;
    submittedAt: string;
  };
  viewsCount: number | null;
  lastMetricSync: string | null;
  lastMetricViews: number | null;
  payoutStatus: string | null;
};

export default function BusinessDealsBoardPage() {
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/business/deals/board");
      const json = await res.json();
      if (!res.ok) {
        setToast({ message: json.error ?? "Failed to load board", type: "error" });
        setLoading(false);
        return;
      }
      setRows(json.data ?? []);
      setLoading(false);
    })().catch(() => {
      setToast({ message: "Failed to load board", type: "error" });
      setLoading(false);
    });
  }, []);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Deal board</h1>
        <p className="subtitle">Operational view: one row per contract. Scroll horizontally on small screens.</p>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="muted">No contracts yet.</p>}
        {!loading && rows.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border, #333)" }}>
                <th style={{ padding: "0.5rem" }}>Campaign</th>
                <th style={{ padding: "0.5rem" }}>Creator</th>
                <th style={{ padding: "0.5rem" }}>IG</th>
                <th style={{ padding: "0.5rem" }}>Followers</th>
                <th style={{ padding: "0.5rem" }}>Contract</th>
                <th style={{ padding: "0.5rem" }}>Accepted</th>
                <th style={{ padding: "0.5rem" }}>ETA</th>
                <th style={{ padding: "0.5rem" }}>Barter</th>
                <th style={{ padding: "0.5rem" }}>Deliverable</th>
                <th style={{ padding: "0.5rem" }}>Views</th>
                <th style={{ padding: "0.5rem" }}>Last sync</th>
                <th style={{ padding: "0.5rem" }}>Payout</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contractId} style={{ borderBottom: "1px solid var(--border, #222)" }}>
                  <td style={{ padding: "0.5rem", maxWidth: "12rem" }}>{r.requirementTitle}</td>
                  <td style={{ padding: "0.5rem" }}>{r.creatorName}</td>
                  <td style={{ padding: "0.5rem" }}>{r.instagramUsername ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>{r.followerCount}</td>
                  <td style={{ padding: "0.5rem" }}>{r.contractStatus}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {r.acceptedAt ? new Date(r.acceptedAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {r.deliveryEtaAt ? new Date(r.deliveryEtaAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{r.barter?.status ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>{r.latestDeliverable?.status ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>{r.viewsCount ?? r.lastMetricViews ?? "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {r.lastMetricSync ? new Date(r.lastMetricSync).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{r.payoutStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

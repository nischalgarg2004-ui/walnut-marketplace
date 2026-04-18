"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type DealRow = {
  id: string;
  status: string;
  requirement: { id: string; title: string; business?: { brandName?: string } };
  contract: null | {
    id: string;
    status: string;
    acceptedAt: string | null;
    barterShipment: null | {
      status: string;
      receivedAt: string | null;
    };
    metricSnapshots: Array<{ capturedAt: string; views: number; source: string }>;
    performanceReport: null | { viewsCount: number; status: string };
  };
};

export default function CreatorDealsPage() {
  const [rows, setRows] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!me.ok || !meData.data?.instagramConnected) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const res = await fetch("/api/creator/deals");
      const json = await res.json();
      if (!res.ok) {
        setToast({ message: json.error ?? "Failed to load deals", type: "error" });
        setLoading(false);
        return;
      }
      setRows(json.data ?? []);
      setLoading(false);
    })().catch(() => {
      setToast({ message: "Failed to load deals", type: "error" });
      setLoading(false);
    });
  }, []);

  async function markBarterReceived(contractId: string) {
    const res = await fetch(`/api/creator/deals/${contractId}/barter-received`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not update", type: "error" });
      return;
    }
    setToast({ message: "Marked as received.", type: "success" });
    const reload = await fetch("/api/creator/deals");
    const j = await reload.json();
    setRows(j.data ?? []);
  }

  async function acceptContract(contractId: string) {
    const res = await fetch(`/api/creator/contracts/${contractId}/accept`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setToast({ message: json.error ?? "Could not accept", type: "error" });
      return;
    }
    setToast({ message: "Contract accepted.", type: "success" });
    const reload = await fetch("/api/creator/deals");
    const j = await reload.json();
    setRows(j.data ?? []);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">My deals</h1>
        <p className="subtitle">Track applications, contracts, barter, and metrics in one place.</p>
      </div>

      <div className="card">
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="muted">No applications yet.</p>}
        <div className="list">
          {rows.map((app) => (
            <article className="card" key={app.id}>
              <h3 className="item-title">{app.requirement.title}</h3>
              <p className="muted">Application: {app.status}</p>
              {app.contract ? (
                <div className="stack" style={{ gap: "0.5rem" }}>
                  <p className="muted">
                    Contract: {app.contract.status}
                    {app.contract.acceptedAt
                      ? ` · Accepted ${new Date(app.contract.acceptedAt).toLocaleString()}`
                      : ""}
                  </p>
                  <Link className="btn primary" href={`/creator/deals/${app.contract.id}`}>
                    Open deal
                  </Link>
                  {app.contract.status === "PENDING" && (
                    <button type="button" className="btn primary" onClick={() => acceptContract(app.contract!.id)}>
                      Accept contract
                    </button>
                  )}
                  {app.contract.barterShipment && app.contract.barterShipment.status !== "RECEIVED" && (
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => markBarterReceived(app.contract!.id)}
                    >
                      Confirm product received (barter)
                    </button>
                  )}
                  {app.contract.metricSnapshots?.[0] ? (
                    <p className="muted">
                      Last metric sync: {new Date(app.contract.metricSnapshots[0].capturedAt).toLocaleString()} · Views:{" "}
                      {app.contract.metricSnapshots[0].views} ({app.contract.metricSnapshots[0].source})
                    </p>
                  ) : app.contract.performanceReport ? (
                    <p className="muted">Views (report): {app.contract.performanceReport.viewsCount}</p>
                  ) : null}
                </div>
              ) : (
                <p className="muted">No contract yet (pending brand decision).</p>
              )}
              <Link className="btn ghost" href={`/creator/opportunity/${app.requirement.id}`}>
                Open opportunity
              </Link>
            </article>
          ))}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

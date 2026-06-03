"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

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
    <PageScaffold
      eyebrow="Business"
      title="Deal board"
      description="Operational view with one row per contract and current execution state."
    >
      <PagePanel className="table-scroller">
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="muted">No contracts yet.</p>}
        {!loading && rows.length > 0 && (
          <table className="dense-table min-w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th>Campaign</th>
                <th>Creator</th>
                <th>IG</th>
                <th>Followers</th>
                <th>Contract</th>
                <th>Accepted</th>
                <th>ETA</th>
                <th>Barter</th>
                <th>Deliverable</th>
                <th>Views</th>
                <th>Last sync</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contractId} className="border-b border-border">
                  <td className="max-w-48">
                    <Link href={`/business/deals/${r.contractId}`} className="text-primary hover:underline">
                      {r.requirementTitle}
                    </Link>
                  </td>
                  <td>{r.creatorName}</td>
                  <td>{r.instagramUsername ?? "—"}</td>
                  <td>{r.followerCount}</td>
                  <td>{r.contractStatus}</td>
                  <td>
                    {r.acceptedAt ? new Date(r.acceptedAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {r.deliveryEtaAt ? new Date(r.deliveryEtaAt).toLocaleDateString() : "—"}
                  </td>
                  <td>{r.barter?.status ?? "—"}</td>
                  <td>{r.latestDeliverable?.status ?? "—"}</td>
                  <td>{r.viewsCount ?? r.lastMetricViews ?? "—"}</td>
                  <td>
                    {r.lastMetricSync ? new Date(r.lastMetricSync).toLocaleString() : "—"}
                  </td>
                  <td>{r.payoutStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PagePanel>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </PageScaffold>
  );
}

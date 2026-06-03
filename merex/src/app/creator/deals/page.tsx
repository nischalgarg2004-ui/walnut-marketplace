"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type DealRow = {
  id: string;
  status: string;
  requirement: { id: string; title: string; postImageUrl?: string | null; business?: { brandName?: string } };
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
    deliverables?: Array<{
      id: string;
      submissions?: Array<{ stage: "DRAFT" | "PUBLISHED_LINK"; status: "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" }>;
    }>;
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
    <PageScaffold
      eyebrow="Creator"
      title="My deals"
      description="Track applications, contracts, barter, and metrics in one place."
      actions={
        <Link className="btn ghost" href="/creator/opportunities">
          Discover opportunities
        </Link>
      }
    >
      <PagePanel>
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="muted">No applications yet.</p>}
        <div className="list">
          {rows.map((app) => (
            <article className="focus-surface p-4" key={app.id}>
              {app.requirement.postImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.requirement.postImageUrl}
                  alt={app.requirement.title}
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                />
              ) : null}
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
                  {app.contract.deliverables?.length ? (
                    <p className="muted text-sm">
                      {(() => {
                        const total = app.contract!.deliverables!.length;
                        const draftApproved = app.contract!.deliverables!.filter((d) =>
                          d.submissions?.some((s) => s.stage === "DRAFT" && s.status === "APPROVED")
                        ).length;
                        const publishApproved = app.contract!.deliverables!.filter((d) =>
                          d.submissions?.some((s) => s.stage === "PUBLISHED_LINK" && s.status === "APPROVED")
                        ).length;
                        return `${total} slots · Draft approved ${draftApproved}/${total} · Publish verified ${publishApproved}/${total}`;
                      })()}
                    </p>
                  ) : null}
                  <Link className="btn primary" href={`/creator/deals/${app.contract.id}`}>
                    Open deal
                  </Link>
                  {app.contract.status === "PENDING" && (
                    <button type="button" className="btn primary" onClick={() => acceptContract(app.contract!.id)}>
                      Accept contract
                    </button>
                  )}
                  {app.contract.barterShipment && app.contract.barterShipment.status !== "RECEIVED" ? (
                    <p className="muted text-sm">
                      Shipment: {app.contract.barterShipment.status}. Confirm receipt inside <strong>Open deal</strong>.
                    </p>
                  ) : null}
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
      </PagePanel>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </PageScaffold>
  );
}

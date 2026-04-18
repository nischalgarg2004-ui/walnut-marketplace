"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    deliverables: Array<{ id: string; status: string }>;
    payouts: Array<{ id: string; status: string }>;
    barterShipment: null | { status: string };
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/creator/deals/${contractId}`);
      const json = await res.json();
      if (!res.ok) {
        setToast({ message: json.error ?? "Could not load deal", type: "error" });
        return;
      }
      setData(json.data);
    })().catch(() => setToast({ message: "Could not load deal", type: "error" }));
  }, [contractId]);

  const steps = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  if (!data) {
    return (
      <section className="stack">
        <div className="skeleton skeleton-card" />
      </section>
    );
  }

  const brand = data.requirement.business?.brandName ?? "Brand";

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

      <div className="row">
        <Link className="btn primary" href={`/creator/opportunity/${data.requirement.id}`}>
          Open opportunity
        </Link>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

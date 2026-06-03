"use client";

import { FormEvent, useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type Contract = {
  id: string;
  requirement: { title: string };
  creator: { fullName: string };
  performanceReport: null | { viewsCount: number; status: string; source: string };
};

type Payout = {
  id: string;
  status: string;
  grossAmount: string;
  commissionAmount: string;
  netAmount: string;
  payoutRef: string | null;
  contract: { requirement: { title: string }; creator: { fullName: string } };
};

export default function BusinessPayoutsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [viewsCount, setViewsCount] = useState(0);
  const [readiness, setReadiness] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  async function load() {
    setLoading(true);
    const [contractsRes, payoutsRes] = await Promise.all([
      fetch("/api/business/contracts"),
      fetch("/api/business/payouts")
    ]);
    const contractsData = await contractsRes.json();
    const payoutsData = await payoutsRes.json();
    setContracts(contractsData.data ?? []);
    setPayouts(payoutsData.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setToast({ message: "Failed to load payouts", type: "error" });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedContractId) {
      setViewsCount(0);
      return;
    }
    const c = contracts.find((x) => x.id === selectedContractId);
    const v = c?.performanceReport?.viewsCount;
    setViewsCount(typeof v === "number" ? v : 0);
  }, [selectedContractId, contracts]);

  useEffect(() => {
    if (!selectedContractId) {
      setReadiness([]);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/business/deals/${selectedContractId}`);
      const json = await res.json();
      if (!res.ok || !json.data) {
        setReadiness(["Unable to load readiness checks"]);
        return;
      }
      const d = json.data as {
        status: string;
        deliverables: Array<{ status: string }>;
        requirement: { compensation?: { hasBarter: boolean } | null };
        barterShipment: { status: string } | null;
        performanceReport: { status: string; source: string } | null;
        payouts: Array<{ status: string }>;
      };
      const issues: string[] = [];
      if (d.status !== "ACTIVE" && d.status !== "COMPLETED") issues.push("Contract must be ACTIVE or COMPLETED");
      if (d.deliverables.some((x) => x.status !== "APPROVED" && x.status !== "PUBLISHED")) {
        issues.push("All deliverables must be approved");
      }
      if (d.requirement.compensation?.hasBarter && d.barterShipment?.status !== "RECEIVED") {
        issues.push("Barter must be marked RECEIVED");
      }
      if (!d.performanceReport || d.performanceReport.status !== "VERIFIED") {
        issues.push("Metrics should be VERIFIED");
      }
      if (d.payouts.some((p) => ["PENDING", "PROCESSING", "PAID"].includes(p.status))) {
        issues.push("Payout already exists or is in progress");
      }
      setReadiness(issues);
    })();
  }, [selectedContractId]);

  async function triggerPayout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const contractId = selectedContractId;
    const response = await fetch("/api/payouts/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contractId,
        viewsCount: Math.max(0, Math.floor(viewsCount))
      })
    });
    const result = await response.json();
    setToast({
      message: response.ok ? `Triggered payout ${result.data.id}` : `Failed: ${result.error}`,
      type: response.ok ? "success" : "error"
    });
    await load();
    setSubmitting(false);
  }

  return (
    <PageScaffold
      eyebrow="Business Ops"
      title="Payout operations"
      description="Trigger fixed or CPV payouts per contract and monitor payout ledger entries in one place."
    >
      <PagePanel>
        <p className="section-subtitle m-0">
          For CPV deals, the views field defaults to the latest verified Instagram Graph metric stored on the deal. You
          can override the number before triggering.
        </p>
        <form onSubmit={triggerPayout} className="form-grid">
          <select
            className="form-full"
            required
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
          >
            <option value="" disabled>
              Select contract
            </option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.requirement.title} - {c.creator.fullName}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={Number.isNaN(viewsCount) ? 0 : viewsCount}
            onChange={(e) => setViewsCount(Number(e.target.value))}
            placeholder="Views count for CPV"
          />
          <div className="row">
            <button className="btn primary" type="submit" disabled={submitting || !selectedContractId}>
              {submitting ? "Triggering..." : "Trigger Payout"}
            </button>
          </div>
        </form>
        {selectedContractId ? (
          <div className="mt-3 rounded-md border border-border/70 bg-muted/20 p-3">
            <p className="m-0 text-sm font-medium text-foreground">Readiness checklist</p>
            {readiness.length === 0 ? (
              <p className="m-0 mt-1 text-sm text-emerald-700">Ready for payout trigger.</p>
            ) : (
              <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {readiness.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </PagePanel>

      <PagePanel title="Payout ledger">
        {loading && (
          <div className="list">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        )}
        <div className="list">
          {!loading && payouts.length === 0 && (
            <div className="empty">
              <div className="empty-visual" />
              No payouts yet.
            </div>
          )}
          {payouts.map((p) => (
            <article key={p.id} className="focus-surface p-4">
              <div className="item-head">
                <h3 className="item-title">
                  {p.contract.requirement.title} - {p.contract.creator.fullName}
                </h3>
                <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>
              </div>
              <p className="muted">
                Gross: {p.grossAmount} | Commission: {p.commissionAmount} | Net: {p.netAmount}
              </p>
              <p className="muted">Reference: {p.payoutRef ?? "pending"}</p>
            </article>
          ))}
        </div>
      </PagePanel>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </PageScaffold>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type Contract = {
  id: string;
  requirement: { title: string };
  creator: { fullName: string };
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

  async function triggerPayout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const contractId = String(form.get("contractId") ?? "");
    const viewsCount = Number(form.get("viewsCount") ?? 0);
    const response = await fetch("/api/payouts/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contractId, viewsCount })
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
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Payout Operations</h1>
        <p className="subtitle">
          Trigger fixed or CPV payouts per contract and monitor payout ledger entries in one place.
        </p>
      </div>

      <div className="card">
        <form onSubmit={triggerPayout} className="form-grid">
          <select className="form-full" name="contractId" required defaultValue="">
            <option value="" disabled>
              Select contract
            </option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.requirement.title} - {c.creator.fullName}
              </option>
            ))}
          </select>
          <input name="viewsCount" type="number" min={0} defaultValue={0} placeholder="Views count for CPV" />
          <div className="row">
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Triggering..." : "Trigger Payout"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Payout Ledger</h2>
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
            <article key={p.id} className="card">
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
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

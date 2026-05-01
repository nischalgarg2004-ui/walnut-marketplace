"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type FundsResponse = {
  wallet: {
    id: string;
    availableBalance: number;
    reservedBalance: number;
    currency: string;
  };
  spendThisMonth: number;
  usageByCampaign: Array<{
    requirementId: string | null;
    campaignTitle: string;
    amount: number;
    status: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    description: string | null;
    reference: string | null;
    createdAt: string;
  }>;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency
  }).format(value);
}

export default function BusinessFundsPageClient() {
  const [data, setData] = useState<FundsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ADD_FUNDS" | "ALLOCATION" | "RELEASE" | "REFUND">("ALL");

  async function loadFunds() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business/funds");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Unable to load funds");
        return;
      }
      setData(json.data as FundsResponse);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFunds();
  }, []);

  async function addFunds(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/business/funds/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Add funds failed");
        return;
      }
      setMessage("Funds added successfully.");
      await loadFunds();
    } finally {
      setAdding(false);
    }
  }

  const currency = data?.wallet.currency ?? "INR";
  const transactions = useMemo(
    () => (data?.transactions ?? []).filter((t) => (filter === "ALL" ? true : t.type === filter)),
    [data, filter]
  );

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Funds</h1>
        <p className="subtitle m-0">Manage wallet balance, commitments, and transaction history.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="stack">
          <div className="card">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="skeleton h-24 rounded-xl" />
                <div className="skeleton h-24 rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Available Balance"
                  value={formatMoney(data?.wallet.availableBalance ?? 0, currency)}
                />
                <MetricCard
                  label="Reserved Funds"
                  value={formatMoney(data?.wallet.reservedBalance ?? 0, currency)}
                />
                <MetricCard label="Spend This Month" value={formatMoney(data?.spendThisMonth ?? 0, currency)} />
                <MetricCard
                  label="Pending Commitments"
                  value={String((data?.usageByCampaign ?? []).filter((x) => x.status === "ACTIVE").length)}
                />
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Add Funds</h2>
            <form className="form-grid" onSubmit={addFunds}>
              <input
                className="form-full"
                type="number"
                min={1}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount"
                required
              />
              <div className="form-full row">
                {[10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="btn ghost"
                    onClick={() => setAmount(preset)}
                  >
                    {formatMoney(preset, currency)}
                  </button>
                ))}
              </div>
              <select
                className="form-full"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
              </select>
              <div className="form-full row">
                <button className="btn primary" type="submit" disabled={adding}>
                  {adding ? "Processing..." : "Proceed"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title m-0">Transaction History</h2>
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <option value="ALL">All</option>
                <option value="ADD_FUNDS">Added Funds</option>
                <option value="ALLOCATION">Spend</option>
                <option value="RELEASE">Release</option>
                <option value="REFUND">Refund</option>
              </select>
            </div>
            <div className="table-scroller mt-3">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-muted-foreground" colSpan={6}>
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="px-3 py-2">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">{tx.type}</td>
                        <td className="px-3 py-2">{tx.description ?? "—"}</td>
                        <td className="px-3 py-2">{formatMoney(tx.amount, currency)}</td>
                        <td className="px-3 py-2">{tx.status}</td>
                        <td className="px-3 py-2">{tx.reference ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3 className="section-title">Upcoming Commitments</h3>
            {(data?.usageByCampaign ?? []).length === 0 ? (
              <p className="muted m-0">No active commitments.</p>
            ) : (
              <ul className="m-0 mt-2 list-none space-y-2 p-0">
                {data?.usageByCampaign.slice(0, 8).map((item, idx) => (
                  <li key={`${item.requirementId ?? "general"}-${idx}`} className="rounded-lg border border-border p-2">
                    <p className="m-0 text-sm font-medium">{item.campaignTitle}</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {formatMoney(item.amount, currency)} · {item.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3 className="section-title">Finance Help</h3>
            <p className="muted m-0 text-sm">Need support with top-ups, invoices, or failed transactions? Contact support.</p>
          </div>
        </aside>
      </div>

      {message ? <p className="help">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 m-0 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

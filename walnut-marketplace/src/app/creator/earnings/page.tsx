"use client";

import { useEffect, useMemo, useState } from "react";

type Earning = {
  id: string;
  status: string;
  grossAmount: string;
  commissionAmount: string;
  netAmount: string;
  releasedAt: string | null;
  contract: {
    requirement: { title: string };
    business: { brandName: string };
  };
};

export default function CreatorEarningsPage() {
  const [items, setItems] = useState<Earning[]>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/creator/earnings");
      if (response.status === 412) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const result = await response.json();
      setItems(result.data ?? []);
    })();
  }, []);

  const totalNet = useMemo(
    () => items.reduce((sum, payout) => sum + Number(payout.netAmount ?? 0), 0),
    [items]
  );

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Earnings</h1>
        <p className="subtitle">Track payout history and net earnings.</p>
      </div>
      <div className="card">
        <p className="stat-label">Total net earnings</p>
        <p className="stat-value">{totalNet.toFixed(2)} INR</p>
      </div>
      <div className="card list">
        {items.length === 0 ? <p className="help">No payouts available yet.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="card">
            <div className="item-head">
              <h3 className="item-title">{item.contract.requirement.title}</h3>
              <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
            </div>
            <p className="muted">
              Brand: {item.contract.business.brandName} | Net: {item.netAmount}
            </p>
            <p className="muted">Released: {item.releasedAt ? new Date(item.releasedAt).toLocaleString() : "Pending"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

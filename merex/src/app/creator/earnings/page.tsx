"use client";

import { useEffect, useMemo, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

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

type Receivable = {
  contractId: string;
  campaignTitle: string;
  brandName: string;
  fixedFeeReceivable: number;
  cpvClaimableEstimate: number;
  totalEstimatedReceivable: number;
  viewsCount: number;
  status: string;
};

export default function CreatorEarningsPage() {
  const [items, setItems] = useState<Earning[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/creator/earnings");
      if (response.status === 412) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const result = await response.json();
      setItems(result.data ?? []);
      setReceivables(result.receivables ?? []);
    })();
  }, []);

  const totalNet = useMemo(
    () => items.reduce((sum, payout) => sum + Number(payout.netAmount ?? 0), 0),
    [items]
  );

  return (
    <PageScaffold eyebrow="Creator" title="Earnings" description="Track payout history and net earnings.">
      <PagePanel className="list" title="Active receivables">
        {receivables.length === 0 ? <p className="help">No active receivables right now.</p> : null}
        {receivables.map((item) => (
          <article key={item.contractId} className="focus-surface p-4">
            <div className="item-head">
              <h3 className="item-title">{item.campaignTitle}</h3>
              <span className="status pending">{item.status}</span>
            </div>
            <p className="muted">
              Brand: {item.brandName} | Fixed: {item.fixedFeeReceivable.toFixed(2)} | CPV est.:{" "}
              {item.cpvClaimableEstimate.toFixed(2)}
            </p>
            <p className="muted">Estimated total receivable: {item.totalEstimatedReceivable.toFixed(2)} INR</p>
          </article>
        ))}
      </PagePanel>
      <PagePanel>
        <p className="stat-label">Total net earnings</p>
        <p className="stat-value">{totalNet.toFixed(2)} INR</p>
      </PagePanel>
      <PagePanel className="list" title="Payout history">
        {items.length === 0 ? <p className="help">No payouts available yet.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="focus-surface p-4">
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
      </PagePanel>
    </PageScaffold>
  );
}

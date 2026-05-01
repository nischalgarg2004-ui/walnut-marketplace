"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type AppItem = {
  id: string;
  status: string;
  appliedAt: string;
  requirement: {
    id: string;
    title: string;
    business: { brandName: string };
  };
};

export default function CreatorApplicationsPage() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/creator/applications");
      if (response.status === 412) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const result = await response.json();
      setItems(result.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PageScaffold
      eyebrow="Creator"
      title="Sent applications"
      description="Track request status across all opportunities."
      actions={
        <Link className="btn ghost" href="/creator/opportunities">
          Browse opportunities
        </Link>
      }
    >
      <PagePanel className="list">
        {!loading && items.length === 0 ? <p className="help">No applications sent yet.</p> : null}
        {items.map((item) => (
          <article className="focus-surface p-4" key={item.id}>
            <div className="item-head">
              <h3 className="item-title">{item.requirement.title}</h3>
              <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
            </div>
            <p className="muted">Brand: {item.requirement.business.brandName}</p>
            <p className="muted">Applied: {new Date(item.appliedAt).toLocaleString()}</p>
            <Link className="btn ghost" href={`/creator/opportunity/${item.requirement.id}`}>
              View opportunity
            </Link>
          </article>
        ))}
      </PagePanel>
    </PageScaffold>
  );
}

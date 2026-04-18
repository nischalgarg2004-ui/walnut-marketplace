"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type Opportunity = {
  id: string;
  title: string;
  brief: string;
};

export default function CreatorDashboardPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  async function load() {
    const me = await fetch("/api/auth/me");
    const meData = await me.json();
    if (!me.ok || !meData.data?.instagramConnected) {
      window.location.assign("/creator/connect-instagram");
      return;
    }
    const response = await fetch("/api/requirements");
    const result = await response.json();
    setItems(result.data ?? []);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => setToast({ message: "Failed to load opportunities", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Creator Discovery Feed</h1>
        <p className="subtitle">Browse live opportunities and open each one for details and apply.</p>
      </div>
      <div className="card">
        {loading && (
          <div className="list">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        )}
        <div className="list">
          {!loading && items.length === 0 && (
            <div className="empty">
              <div className="empty-visual" />
              No opportunities available.
            </div>
          )}
          {items.map((item) => (
            <article className="card" key={item.id}>
              <h3 className="item-title">{item.title}</h3>
              <p className="muted">{item.brief}</p>
              <Link className="btn primary" href={`/creator/opportunity/${item.id}`}>
                View opportunity
              </Link>
            </article>
          ))}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

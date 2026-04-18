"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/ui/Toast";

type Application = {
  id: string;
  status: "APPLIED" | "WAITLISTED" | "APPROVED" | "REJECTED";
  pitch: string | null;
  requirement: { id: string; title: string };
  creator: { id: string; fullName: string; followerCount: number };
};

export default function BusinessApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/business/applications");
    const result = await response.json();
    setItems(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setToast({ message: "Failed to load applications", type: "error" });
      setLoading(false);
    });
  }, []);

  async function decideOne(id: string, status: "APPROVED" | "REJECTED" | "WAITLISTED") {
    setUpdating(true);
    const response = await fetch(`/api/applications/${id}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) {
      setToast({ message: `Failed: ${result.error}`, type: "error" });
      setUpdating(false);
      return;
    }
    setToast({ message: `Updated application to ${status}.`, type: "success" });
    await load();
    setUpdating(false);
  }

  async function decideBulk(status: "APPROVED" | "REJECTED" | "WAITLISTED") {
    if (selected.length === 0) {
      setToast({ message: "Select at least one application.", type: "info" });
      return;
    }
    setUpdating(true);
    const response = await fetch("/api/applications/bulk-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ applicationIds: selected, status })
    });
    const result = await response.json();
    if (!response.ok) {
      setToast({ message: `Failed: ${result.error}`, type: "error" });
      setUpdating(false);
      return;
    }
    setToast({
      message: `Bulk updated ${result.data.updated}/${result.data.requested} applications.`,
      type: "success"
    });
    setSelected([]);
    await load();
    setUpdating(false);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Application Approvals</h1>
        <p className="subtitle">
          Review incoming creator applications and process decisions one-by-one or in bulk.
        </p>
      </div>

      <div className="card">
        <div className="toolbar">
          <button className="btn primary" onClick={() => decideBulk("APPROVED")} disabled={updating}>
            Bulk Approve
          </button>
          <button className="btn secondary" onClick={() => decideBulk("WAITLISTED")} disabled={updating}>
            Bulk Waitlist
          </button>
          <button className="btn danger" onClick={() => decideBulk("REJECTED")} disabled={updating}>
            Bulk Reject
          </button>
          <span className="pill">{selected.length} selected</span>
        </div>
        {loading && (
          <div className="list">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        )}

        <div className="list">
          {!loading && items.length === 0 && (
            <div className="empty">
              <div className="empty-visual" />
              No applications received yet.
            </div>
          )}
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="item-head">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(item.id)}
                    onChange={(e) => {
                      setSelected((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((x) => x !== item.id)
                      );
                    }}
                  />{" "}
                  <strong>{item.creator.fullName}</strong> · {item.requirement.title}
                </label>
                <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <p className="muted">Followers: {item.creator.followerCount}</p>
              <p className="muted">{item.pitch ?? "No pitch provided."}</p>
              <div className="row">
                <button
                  className="btn primary"
                  onClick={() => decideOne(item.id, "APPROVED")}
                  disabled={updating}
                >
                  Approve
                </button>
                <button
                  className="btn secondary"
                  onClick={() => decideOne(item.id, "WAITLISTED")}
                  disabled={updating}
                >
                  Waitlist
                </button>
                <button
                  className="btn danger"
                  onClick={() => decideOne(item.id, "REJECTED")}
                  disabled={updating}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

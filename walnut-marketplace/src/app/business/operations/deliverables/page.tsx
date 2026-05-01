"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type Deliverable = {
  id: string;
  fileUrl: string;
  fileType: string;
  status: "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED";
  feedback: string | null;
  contract: { requirement: { title: string } };
};

export default function BusinessDeliverablesPage() {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  async function load() {
    setLoading(true);
    const response = await fetch("/api/business/deliverables");
    const result = await response.json();
    setItems(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setToast({ message: "Failed to load deliverables", type: "error" });
      setLoading(false);
    });
  }, []);

  async function review(id: string, action: "APPROVE" | "REQUEST_REVISION") {
    const response = await fetch(`/api/deliverables/${id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        feedback: action === "REQUEST_REVISION" ? "Please improve hook in first 3 seconds." : undefined
      })
    });
    const result = await response.json();
    setToast({
      message: response.ok ? "Deliverable updated successfully." : `Failed: ${result.error}`,
      type: response.ok ? "success" : "error"
    });
    await load();
  }

  return (
    <PageScaffold
      eyebrow="Business Ops"
      title="Deliverables review"
      description="Validate submission quality, approve publish-ready assets, or request revisions quickly."
    >
      <PagePanel>
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
              No deliverables submitted yet.
            </div>
          )}
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="item-head">
                <h3 className="item-title">{item.contract.requirement.title}</h3>
                <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <p className="muted">Type: {item.fileType}</p>
              <p className="muted">
                File:{" "}
                <a href={item.fileUrl} target="_blank" rel="noreferrer">
                  {item.fileUrl}
                </a>
              </p>
              <p className="muted">{item.feedback ?? "No feedback yet."}</p>
              <div className="row">
                <button className="btn primary" onClick={() => review(item.id, "APPROVE")}>
                  Approve
                </button>
                <button className="btn secondary" onClick={() => review(item.id, "REQUEST_REVISION")}>
                  Request Revision
                </button>
              </div>
            </article>
          ))}
        </div>
      </PagePanel>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </PageScaffold>
  );
}

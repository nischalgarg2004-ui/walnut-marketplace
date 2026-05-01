"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type Requirement = {
  id: string;
  title: string;
  brief: string;
};

export default function CreatorRequirementsPage() {
  const [items, setItems] = useState<Requirement[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetch("/api/auth/me"), fetch("/api/requirements")])
      .then(async ([meRes, reqRes]) => {
        const me = await meRes.json();
        if (!meRes.ok || !me.data?.instagramConnected) {
          window.location.assign("/creator/connect-instagram");
          return;
        }
        return reqRes.json();
      })
      .then((data) => setItems(data?.data ?? []))
      .catch(() => setToast({ message: "Failed to load requirements", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  async function apply(requirementId: string) {
    setApplyingId(requirementId);
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requirementId,
        pitch: "I create skincare-focused UGC with strong retention."
      })
    });
    const result = await response.json();
    setToast({
      message: response.ok ? "Application submitted successfully." : `Failed: ${result.error}`,
      type: response.ok ? "success" : "error"
    });
    setApplyingId(null);
  }

  return (
    <PageScaffold
      eyebrow="Creator"
      title="Opportunity feed"
      description="Apply to requirements that align with your niche and audience profile."
    >
      <PagePanel>
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
              No published requirements yet.
            </div>
          )}
          {items.map((item) => (
            <article key={item.id} className="focus-surface p-4">
              <div className="item-head">
                <h3 className="item-title">{item.title}</h3>
                <span className="pill">Open</span>
              </div>
              <p className="muted">{item.brief}</p>
              <button
                className="btn primary"
                onClick={() => apply(item.id)}
                disabled={applyingId === item.id}
              >
                {applyingId === item.id ? "Applying..." : "Apply Now"}
              </button>
            </article>
          ))}
        </div>
      </PagePanel>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </PageScaffold>
  );
}

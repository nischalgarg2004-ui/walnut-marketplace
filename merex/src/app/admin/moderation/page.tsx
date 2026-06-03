"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import Toast from "@/components/ui/Toast";

type Row = {
  id: string;
  title: string;
  status: string;
  business: { brandName: string };
  applications: { id: string }[];
};

export default function AdminModerationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });
  const [flagging, setFlagging] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation/requirements", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function flagRequirement(requirementId: string, title: string) {
    const reason = window.prompt(`Flag reason for "${title}" (min 5 chars):`, "Review requested");
    if (!reason || reason.trim().length < 5) return;
    setFlagging(requirementId);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "REQUIREMENT", entityId: requirementId, reason: reason.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Flag failed");
      setToast({ message: "Flag recorded.", type: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Flag failed", type: "error" });
    } finally {
      setFlagging(null);
    }
  }

  return (
    <>
      <PageScaffold
        eyebrow="Admin"
        title="Moderation"
        description="Published requirements (latest 100). Flag suspicious listings for triage."
        actions={
          <button type="button" className="btn secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      >
        {error ? (
          <div className="card border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <PagePanel title="Published requirements">
            <div className="table-scroller">
              <table className="dense-table min-w-full">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Brand</th>
                    <th>Apps</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="max-w-[240px] truncate font-medium">{r.title}</td>
                      <td>{r.business?.brandName ?? "—"}</td>
                      <td className="tabular-nums">{r.applications?.length ?? 0}</td>
                      <td className="text-end">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link className="btn ghost text-xs" href={`/creator/opportunity/${r.id}`} target="_blank" rel="noreferrer">
                            View live
                          </Link>
                          <button
                            type="button"
                            className="btn secondary text-xs"
                            disabled={flagging === r.id}
                            onClick={() => void flagRequirement(r.id, r.title)}
                          >
                            Flag
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No published requirements.</p> : null}
          </PagePanel>
        )}
      </PageScaffold>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

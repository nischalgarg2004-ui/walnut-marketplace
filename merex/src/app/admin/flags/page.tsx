"use client";

import { useCallback, useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import Toast from "@/components/ui/Toast";

type Flag = {
  id: string;
  entityType: string;
  entityId: string;
  reason: string;
  status: string;
  assignedAdminId: string | null;
  createdAt: string;
};

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
      const res = await fetch(`/api/admin/flags${qs}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setFlags(json.data ?? []);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Load failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "OPEN" | "RESOLVED" | "DISMISSED") {
    try {
      const res = await fetch(`/api/admin/flags/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setToast({ message: `Flag marked ${status}.`, type: "success" });
      await load();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Update failed", type: "error" });
    }
  }

  return (
    <>
      <PageScaffold
        eyebrow="Admin"
        title="Flags queue"
        description="Operational flags created from moderation or internal review."
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="rounded-lg border border-border bg-background px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
            <button type="button" className="btn secondary" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </div>
        }
      >
        <PagePanel title="Flags">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="table-scroller">
              <table className="dense-table min-w-full">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((f) => (
                    <tr key={f.id} className="border-t border-border">
                      <td className="font-mono text-xs">
                        {f.entityType}:{f.entityId.slice(0, 12)}…
                      </td>
                      <td className="max-w-[280px] truncate text-sm">{f.reason}</td>
                      <td>
                        <span className="pill">{f.status}</span>
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(f.createdAt).toLocaleString()}
                      </td>
                      <td className="text-end">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button type="button" className="btn ghost text-xs" onClick={() => void setStatus(f.id, "RESOLVED")}>
                            Resolve
                          </button>
                          <button type="button" className="btn ghost text-xs" onClick={() => void setStatus(f.id, "DISMISSED")}>
                            Dismiss
                          </button>
                          <button type="button" className="btn ghost text-xs" onClick={() => void setStatus(f.id, "OPEN")}>
                            Reopen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && flags.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No flags match this filter.</p> : null}
        </PagePanel>
      </PageScaffold>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

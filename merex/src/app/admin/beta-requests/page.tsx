"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import Toast from "@/components/ui/Toast";

type BetaRequestRow = {
  id: string;
  name: string;
  mobileNumber: string;
  instagramUsername: string;
  roleType: string;
  status: string;
  createdAt: string;
};

export default function AdminBetaRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<BetaRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());
      
      const res = await fetch(`/api/admin/beta-requests?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load requests");
      setRows(json.data ?? []);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Load failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, q]);

  useEffect(() => {
    void load();
  }, [statusFilter]);

  async function updateStatus(id: string, status: "PENDING" | "GRANTED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setToast({ message: `Access request marked as ${status.toLowerCase()}.`, type: "success" });
      await load();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Update failed", type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRequest(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setToast({ message: "Access request permanently deleted.", type: "success" });
      await load();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageScaffold
        eyebrow="Admin"
        title="Beta access requests"
        description="Spreadsheet of early access signups. Review candidates, mark status approvals/rejections, or permanently clean up request logs."
      >
        <PagePanel title="Filters">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status filters">
            {["ALL", "PENDING", "GRANTED", "REJECTED"].map((st) => (
              <button
                key={st}
                type="button"
                role="tab"
                aria-selected={statusFilter === st}
                className={statusFilter === st ? "btn primary" : "btn ghost"}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Search by name or Instagram username</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load();
                }}
                placeholder="Contains…"
                className="w-full font-mono text-sm"
              />
            </label>
            <button type="button" className="btn primary" onClick={() => void load()} disabled={loading}>
              {loading ? "Loading…" : "Apply filter"}
            </button>
          </div>
        </PagePanel>

        <PagePanel title="Request Ledger" className="mt-4">
          <div className="mb-3 text-sm text-muted-foreground">
            {loading ? (
              "Loading requests…"
            ) : rows.length === 0 ? (
              "No early access requests found."
            ) : (
              <span>
                Found <strong className="text-foreground">{rows.length}</strong> records matching active filters.
              </span>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="table-scroller border border-border rounded-lg overflow-hidden shadow-inner">
              <table className="dense-table min-w-full border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Instagram</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Requested At</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-end">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border hover:bg-stone-50/50 transition-colors text-sm">
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <a
                          href={`https://instagram.com/${row.instagramUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          @{row.instagramUsername}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.mobileNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`pill font-mono text-[10px] px-2 py-0.5 rounded ${
                          row.roleType === "UGC" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {row.roleType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`pill font-bold text-[10px] px-2 py-1 rounded border uppercase tracking-wider ${
                          row.status === "GRANTED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : row.status === "REJECTED"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end items-center gap-1.5">
                          {row.status !== "GRANTED" && (
                            <button
                              type="button"
                              className="btn secondary text-xs py-1 px-2.5 h-auto"
                              disabled={busyId === row.id}
                              onClick={() => void updateStatus(row.id, "GRANTED")}
                            >
                              Grant
                            </button>
                          )}
                          {row.status !== "REJECTED" && (
                            <button
                              type="button"
                              className="btn ghost text-xs py-1 px-2.5 h-auto text-yellow-700 hover:bg-yellow-50"
                              disabled={busyId === row.id}
                              onClick={() => void updateStatus(row.id, "REJECTED")}
                            >
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn ghost text-xs py-1 px-2.5 h-auto text-red-600 hover:bg-red-50"
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (window.confirm(`Permanently delete request from ${row.name}?`)) {
                                void deleteRequest(row.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </PagePanel>
      </PageScaffold>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import Toast from "@/components/ui/Toast";

type PayoutRow = {
  id: string;
  status: string;
  grossAmount: string;
  netAmount: string;
  commissionAmount: string;
  payoutProvider: string;
  payoutRef: string | null;
  contractId: string;
  requirementTitle: string;
  brandName: string;
  creatorName: string;
  creatorInstagram: string | null;
};

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.data ?? []);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Load failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reconcile(id: string, action: "RETRY" | "HOLD" | "RELEASE") {
    const note = window.prompt("Optional note (for audit log):") ?? "";
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}/reconcile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Reconcile failed");
      setToast({ message: `Payout ${id.slice(0, 8)}… → ${action}`, type: "success" });
      await load();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Reconcile failed", type: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageScaffold
        eyebrow="Admin"
        title="Payout exceptions"
        description="Pending, processing, and failed payouts. Use reconcile actions with care."
        actions={
          <button type="button" className="btn secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      >
        <PagePanel title="Queue">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="table-scroller">
              <table className="dense-table min-w-full">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Gross</th>
                    <th>Campaign</th>
                    <th>Brand / Creator</th>
                    <th className="text-end">Reconcile</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td>
                        <span className="pill">{p.status}</span>
                      </td>
                      <td className="tabular-nums text-sm">₹{Number(p.grossAmount).toLocaleString("en-IN")}</td>
                      <td className="max-w-[200px] truncate text-sm">{p.requirementTitle}</td>
                      <td className="text-xs text-muted-foreground">
                        <div>{p.brandName}</div>
                        <div>
                          {p.creatorName}
                          {p.creatorInstagram ? ` · @${p.creatorInstagram}` : ""}
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            className="btn ghost text-xs"
                            disabled={busy === p.id}
                            onClick={() => void reconcile(p.id, "RETRY")}
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            className="btn ghost text-xs"
                            disabled={busy === p.id}
                            onClick={() => void reconcile(p.id, "HOLD")}
                          >
                            Hold
                          </button>
                          <button
                            type="button"
                            className="btn primary text-xs"
                            disabled={busy === p.id}
                            onClick={() => {
                              if (!window.confirm("Mark payout as PAID (RELEASE)? Only if funds actually settled.")) return;
                              void reconcile(p.id, "RELEASE");
                            }}
                          >
                            Release
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No payouts in pending/processing/failed for this view.</p>
          ) : null}
        </PagePanel>
      </PageScaffold>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

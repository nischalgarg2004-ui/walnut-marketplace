"use client";

import { useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type Row = {
  id: string;
  actorEmail: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: unknown;
  createdAt: string;
};

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPage(cursor: string | null, append: boolean) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "40" });
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(`/api/admin/audit-log?${qs}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      const data = (json.data ?? []) as Row[];
      setNextCursor(json.meta?.nextCursor ?? null);
      if (append) {
        setRows((prev) => [...prev, ...data]);
      } else {
        setRows(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPage(null, false);
  }, []);

  return (
    <PageScaffold
      eyebrow="Admin"
      title="Audit log"
      description="Immutable trail of audited actions (actor, entity, action). Fed from the AuditLog table."
      actions={
        <button type="button" className="btn secondary" onClick={() => void fetchPage(null, false)} disabled={loading}>
          Refresh
        </button>
      }
    >
      {error ? <div className="card border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
      <PagePanel title="Events">
        <div className="table-scroller">
          <table className="dense-table min-w-full">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="border-t border-border">
                  <td className="whitespace-nowrap text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="text-xs">
                    <div className="font-medium">{event.actorEmail}</div>
                    <div className="text-muted-foreground">{event.actorRole}</div>
                  </td>
                  <td className="font-mono text-xs">{event.action}</td>
                  <td className="font-mono text-xs">
                    {event.entityType}:{event.entityId}
                  </td>
                  <td className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {event.metadata ? JSON.stringify(event.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && !loading ? <p className="mt-3 text-sm text-muted-foreground">No audit entries yet.</p> : null}
        {nextCursor ? (
          <div className="mt-4">
            <button type="button" className="btn secondary" onClick={() => void fetchPage(nextCursor, true)} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </PagePanel>
    </PageScaffold>
  );
}

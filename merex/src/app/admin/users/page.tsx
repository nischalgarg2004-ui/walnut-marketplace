"use client";

import { useCallback, useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import Toast from "@/components/ui/Toast";

type UserMode = "creator" | "business";

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  creatorProfile: { id: string; fullName: string; kycStatus: string; instagramUsername: string | null } | null;
  businessProfile: { id: string; brandName: string; verificationStatus: string } | null;
};

type ListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Kyc = "PENDING" | "APPROVED" | "REJECTED";

const PAGE_SIZE = 50;

export default function AdminUsersPage() {
  const [mode, setMode] = useState<UserMode>("creator");
  const [q, setQ] = useState("");
  const [meta, setMeta] = useState<ListMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 });
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [kycDraft, setKycDraft] = useState<Record<string, Kyc>>({});
  const [bizDraft, setBizDraft] = useState<Record<string, Kyc>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({ message: "", type: "success" });

  const load = useCallback(
    async (opts?: { page?: number }) => {
      setLoading(true);
      try {
        const targetPage = opts?.page ?? meta.page;
        const params = new URLSearchParams();
        params.set("mode", mode);
        params.set("limit", String(PAGE_SIZE));
        params.set("page", String(targetPage));
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Load failed");
        const data = (json.data ?? []) as UserRow[];
        const m = json.meta as ListMeta | undefined;
        if (m) setMeta(m);
        setRows(data);
        const kyc: Record<string, Kyc> = {};
        const biz: Record<string, Kyc> = {};
        for (const u of data) {
          if (u.creatorProfile) kyc[u.id] = u.creatorProfile.kycStatus as Kyc;
          if (u.businessProfile) biz[u.id] = u.businessProfile.verificationStatus as Kyc;
        }
        setKycDraft(kyc);
        setBizDraft(biz);
      } catch (e) {
        setToast({ message: e instanceof Error ? e.message : "Load failed", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [mode, q, meta.page]
  );

  useEffect(() => {
    void load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function patchUser(userId: string, body: Record<string, unknown>) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setToast({ message: "User updated.", type: "success" });
      await load();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Update failed", type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const rangeFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const rangeTo = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <>
      <PageScaffold
        eyebrow="Admin"
        title="User directory"
        description="Creators and businesses are listed separately, paginated (50 per page). Filter by email when needed. Suspend or reactivate accounts (non-admin). Adjust creator KYC and business verification when ops policy allows."
      >
        <PagePanel title="Directory">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="User type">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "creator"}
              className={mode === "creator" ? "btn primary" : "btn ghost"}
              onClick={() => setMode("creator")}
            >
              Creators
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "business"}
              className={mode === "business" ? "btn primary" : "btn ghost"}
              onClick={() => setMode("business")}
            >
              Businesses
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Filter by email (optional)</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load({ page: 1 });
                }}
                placeholder="Contains…"
                className="w-full"
              />
            </label>
            <button type="button" className="btn primary" onClick={() => void load({ page: 1 })} disabled={loading}>
              {loading ? "Loading…" : "Apply filter"}
            </button>
          </div>
        </PagePanel>
        <PagePanel title={mode === "creator" ? "Creators" : "Businesses"} className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {loading ? (
                "Loading…"
              ) : meta.total === 0 ? (
                `No ${mode === "creator" ? "creator" : "business"} accounts${q.trim() ? " for this filter" : ""}.`
              ) : (
                <>
                  Showing <strong className="text-foreground">{rangeFrom}</strong>–
                  <strong className="text-foreground">{rangeTo}</strong> of{" "}
                  <strong className="text-foreground">{meta.total}</strong>
                  {meta.totalPages > 1 ? (
                    <>
                      {" "}
                      · Page <strong className="text-foreground">{meta.page}</strong> of{" "}
                      <strong className="text-foreground">{meta.totalPages}</strong>
                    </>
                  ) : null}
                </>
              )}
            </span>
            {meta.totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn ghost text-xs"
                  disabled={loading || meta.page <= 1}
                  onClick={() => void load({ page: meta.page - 1 })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn ghost text-xs"
                  disabled={loading || meta.page >= meta.totalPages}
                  onClick={() => void load({ page: meta.page + 1 })}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
          {rows.length > 0 ? (
            <div className="table-scroller">
              <table className="dense-table min-w-full">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Joined</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="font-mono text-xs">{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className="pill">{u.status}</span>
                      </td>
                      <td className="max-w-[220px] text-xs text-muted-foreground">
                        {u.creatorProfile ? (
                          <span className="block">
                            Creator: {u.creatorProfile.fullName} · KYC {u.creatorProfile.kycStatus}
                            {u.creatorProfile.instagramUsername ? ` · @${u.creatorProfile.instagramUsername}` : ""}
                          </span>
                        ) : null}
                        {u.businessProfile ? (
                          <span className="block">
                            Business: {u.businessProfile.brandName} · {u.businessProfile.verificationStatus}
                          </span>
                        ) : null}
                        {!u.creatorProfile && !u.businessProfile ? "—" : null}
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap justify-end gap-1">
                            {u.status === "ACTIVE" ? (
                              <button
                                type="button"
                                className="btn ghost text-xs"
                                disabled={busyId === u.id || u.role === "ADMIN"}
                                title={u.role === "ADMIN" ? "Cannot suspend admin accounts" : undefined}
                                onClick={() => {
                                  if (!window.confirm(`Suspend ${u.email}? They will be signed out on next request.`)) return;
                                  void patchUser(u.id, { userStatus: "SUSPENDED" });
                                }}
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn ghost text-xs"
                                disabled={busyId === u.id}
                                onClick={() => void patchUser(u.id, { userStatus: "ACTIVE" })}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                          {u.creatorProfile ? (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <select
                                className="rounded border border-border bg-background px-1 py-0.5 text-xs"
                                value={kycDraft[u.id] ?? "PENDING"}
                                onChange={(e) => setKycDraft((d) => ({ ...d, [u.id]: e.target.value as Kyc }))}
                              >
                                <option value="PENDING">KYC PENDING</option>
                                <option value="APPROVED">KYC APPROVED</option>
                                <option value="REJECTED">KYC REJECTED</option>
                              </select>
                              <button
                                type="button"
                                className="btn secondary text-xs"
                                disabled={busyId === u.id || !kycDraft[u.id]}
                                onClick={() => void patchUser(u.id, { creatorKycStatus: kycDraft[u.id] })}
                              >
                                Set KYC
                              </button>
                            </div>
                          ) : null}
                          {u.businessProfile ? (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <select
                                className="rounded border border-border bg-background px-1 py-0.5 text-xs"
                                value={bizDraft[u.id] ?? "PENDING"}
                                onChange={(e) => setBizDraft((d) => ({ ...d, [u.id]: e.target.value as Kyc }))}
                              >
                                <option value="PENDING">Verify PENDING</option>
                                <option value="APPROVED">Verify APPROVED</option>
                                <option value="REJECTED">Verify REJECTED</option>
                              </select>
                              <button
                                type="button"
                                className="btn secondary text-xs"
                                disabled={busyId === u.id || !bizDraft[u.id]}
                                onClick={() => void patchUser(u.id, { businessVerificationStatus: bizDraft[u.id] })}
                              >
                                Set verify
                              </button>
                            </div>
                          ) : null}
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

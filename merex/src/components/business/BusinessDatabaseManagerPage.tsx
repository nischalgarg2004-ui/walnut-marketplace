"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessDataTable } from "@/components/design-system/BusinessDataTable";

type RequirementItem = { id: string; title: string; status: string };

type DeliverableItem = {
  id: string;
  status: string;
  slotIndex: number | null;
  expectedKind: string | null;
};

type ApplicationItem = {
  id: string;
  status: string;
  decisionReason: string | null;
  appliedAt: string;
  creator: {
    fullName: string;
    instagramUsername: string | null;
    followerCount: number;
    avgEngagement: number;
  };
  contract: null | {
    id: string;
    status: string;
    deliverables: DeliverableItem[];
    barterShipment?: { id: string; status: string } | null;
    payouts?: Array<{ id: string; status: string }>;
  };
};

type RequirementApplicationsResponse = {
  requirement: { id: string; title: string };
  applications: ApplicationItem[];
};

type FilterType = "ALL" | "APPROVED" | "REJECTED" | "PENDING";

export default function BusinessDatabaseManagerPage() {
  const searchParams = useSearchParams();
  const campaignParam = searchParams.get("campaign");
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<RequirementApplicationsResponse | null>(null);

  async function loadRequirements() {
    const res = await fetch("/api/business/requirements");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load campaigns");
      return;
    }
    const rows = (json.data ?? []) as RequirementItem[];
    setRequirements(rows);
    if (!selectedRequirementId && rows.length > 0) {
      setSelectedRequirementId(rows[0].id);
    }
  }

  async function loadApplications(requirementId: string) {
    if (!requirementId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/business/requirements/${requirementId}/applications`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load applications");
        setData(null);
        return;
      }
      setData(json.data as RequirementApplicationsResponse);
      setSelectedRows([]);
      setExpandedRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequirements();
  }, []);

  useEffect(() => {
    if (!campaignParam) return;
    setSelectedRequirementId(campaignParam);
  }, [campaignParam]);

  useEffect(() => {
    void loadApplications(selectedRequirementId);
  }, [selectedRequirementId]);

  const filteredRows = useMemo(() => {
    const base = data?.applications ?? [];
    return base.filter((app) => {
      const matchesFilter =
        filterType === "ALL"
          ? true
          : filterType === "PENDING"
            ? app.status === "APPLIED" || app.status === "WAITLISTED"
            : app.status === filterType;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        app.creator.fullName.toLowerCase().includes(q) ||
        (app.creator.instagramUsername ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [data, filterType, searchQuery]);

  async function decideApplication(applicationId: string, status: "APPROVED" | "REJECTED" | "WAITLISTED") {
    setSavingId(applicationId);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update application");
        return;
      }
      setMessage("Application status updated.");
      await loadApplications(selectedRequirementId);
    } finally {
      setSavingId("");
    }
  }

  async function bulkDecide(status: "APPROVED" | "REJECTED" | "WAITLISTED") {
    if (selectedRows.length === 0) return;
    setSavingId("bulk");
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/applications/bulk-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: selectedRows, status })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Bulk update failed");
        return;
      }
      setMessage(`Bulk update completed for ${selectedRows.length} applications.`);
      await loadApplications(selectedRequirementId);
    } finally {
      setSavingId("");
    }
  }

  async function reviewDeliverable(deliverableId: string, action: "APPROVE" | "REQUEST_REVISION") {
    setSavingId(deliverableId);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update deliverable");
        return;
      }
      setMessage("Deliverable updated.");
      await loadApplications(selectedRequirementId);
    } finally {
      setSavingId("");
    }
  }

  async function updateWorkspaceRow(
    applicationId: string,
    patch: {
      contractStatus?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";
      productSentStatus?: "PENDING" | "SHIPPED" | "RECEIVED";
      paymentStatus?: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
      internalNote?: string;
    }
  ) {
    setSavingId(`workspace-${applicationId}`);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/business/applications/${applicationId}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update row");
        return;
      }
      setMessage("Row updated.");
      await loadApplications(selectedRequirementId);
    } finally {
      setSavingId("");
    }
  }

  async function reviewAllDeliverables(contractId: string, action: "APPROVE" | "REQUEST_REVISION") {
    const target = (data?.applications ?? []).find((x) => x.contract?.id === contractId);
    const ids = target?.contract?.deliverables?.map((d) => d.id) ?? [];
    if (ids.length === 0) return;
    setSavingId(`contract-${contractId}`);
    setError("");
    setMessage("");
    try {
      for (const id of ids) {
        const res = await fetch(`/api/deliverables/${id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action })
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "One or more deliverables failed to update");
          break;
        }
      }
      setMessage("All deliverables in this contract were updated.");
      await loadApplications(selectedRequirementId);
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="stack rounded-xl border border-[#d0d7e2] bg-[#f8fafc] p-4 text-[#0f172a]">
      <div className="rounded-xl border border-[#d0d7e2] bg-white p-4 shadow-sm">
        <h1 className="title">Database Manager</h1>
        <p className="subtitle m-0 text-[#475569]">Manage applications, statuses, and deliverables from one operational workspace.</p>
      </div>

      <div className="rounded-xl border border-[#d0d7e2] bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#e2e8f0] pb-3">
          <button className="rounded border border-[#d0d7e2] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#334155]">File</button>
          <button className="rounded border border-[#d0d7e2] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#334155]">Edit</button>
          <button className="rounded border border-[#d0d7e2] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#334155]">View</button>
          <button className="rounded border border-[#d0d7e2] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#334155]">Data</button>
          <span className="ml-auto text-xs text-[#64748b]">{filteredRows.length} rows</span>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-md border border-[#d0d7e2] bg-[#f8fafc] px-3 py-2">
          <span className="text-xs font-semibold text-[#64748b]">fx</span>
          <span className="truncate text-sm text-[#334155]">
            {data?.requirement?.title
              ? `Campaign: ${data.requirement.title}`
              : "Select a campaign to start editing like a spreadsheet"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="form-full"
            value={selectedRequirementId}
            onChange={(e) => setSelectedRequirementId(e.target.value)}
          >
            <option value="">Select campaign</option>
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          <select
            className="form-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
          >
            <option value="ALL">All Applications</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <input
            className="form-full md:col-span-2"
            type="search"
            placeholder="Search creators"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <BusinessDataTable
        spreadsheetMode
        loading={loading}
        rows={filteredRows.map((r) => ({ ...r, id: r.id }))}
        empty={selectedRequirementId ? "No applications match your filters." : "Select a campaign to begin."}
        bulkBar={
          selectedRows.length > 0 ? (
            <>
              <span className="text-sm text-muted-foreground">{selectedRows.length} selected</span>
              <button className="btn secondary" disabled={savingId === "bulk"} onClick={() => void bulkDecide("APPROVED")}>
                Accept
              </button>
              <button className="btn secondary" disabled={savingId === "bulk"} onClick={() => void bulkDecide("WAITLISTED")}>
                Waitlist
              </button>
              <button className="btn secondary" disabled={savingId === "bulk"} onClick={() => void bulkDecide("REJECTED")}>
                Reject
              </button>
            </>
          ) : null
        }
        columns={[
          {
            id: "select",
            header: "",
            className: "w-10",
            cell: (row) => (
              <input
                type="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={(e) =>
                  setSelectedRows((prev) =>
                    e.target.checked ? Array.from(new Set([...prev, row.id])) : prev.filter((x) => x !== row.id)
                  )
                }
              />
            )
          },
          {
            id: "creator",
            header: "Creator",
            cell: (row) => (
              <div>
                <p className="m-0 font-medium">{row.creator.fullName}</p>
                <p className="m-0 text-xs text-muted-foreground">
                  {row.creator.instagramUsername ? `@${row.creator.instagramUsername}` : "No handle"}
                </p>
              </div>
            )
          },
          {
            id: "followers",
            header: "Followers",
            cell: (row) => <span>{row.creator.followerCount}</span>
          },
          {
            id: "engagement",
            header: "Engagement",
            cell: (row) => <span>{row.creator.avgEngagement.toFixed(2)}%</span>
          },
          {
            id: "applicationStatus",
            header: "Application",
            cell: (row) => (
              <select
                className="min-w-[140px]"
                value={row.status}
                disabled={savingId === row.id}
                onChange={(e) => void decideApplication(row.id, e.target.value as "APPROVED" | "REJECTED" | "WAITLISTED")}
              >
                <option value="APPLIED">Applied</option>
                <option value="WAITLISTED">Waitlisted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            )
          },
          {
            id: "contract",
            header: "Deal Status",
            cell: (row) =>
              row.contract ? (
                <select
                  className="min-w-[140px]"
                  value={row.contract.status}
                  disabled={savingId === `workspace-${row.id}`}
                  onChange={(e) =>
                    void updateWorkspaceRow(row.id, {
                      contractStatus: e.target.value as "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED"
                    })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              ) : (
                <span>—</span>
              )
          },
          {
            id: "productSent",
            header: "Product Sent",
            cell: (row) =>
              row.contract ? (
                <select
                  className="min-w-[130px]"
                  value={row.contract.barterShipment?.status ?? "PENDING"}
                  disabled={savingId === `workspace-${row.id}`}
                  onChange={(e) =>
                    void updateWorkspaceRow(row.id, {
                      productSentStatus: e.target.value as "PENDING" | "SHIPPED" | "RECEIVED"
                    })
                  }
                >
                  <option value="PENDING">Not Sent</option>
                  <option value="SHIPPED">Sent</option>
                  <option value="RECEIVED">Delivered</option>
                </select>
              ) : (
                <span>—</span>
              )
          },
          {
            id: "paymentStatus",
            header: "Payment",
            cell: (row) =>
              row.contract ? (
                <select
                  className="min-w-[130px]"
                  value={row.contract.payouts?.[0]?.status ?? "PENDING"}
                  disabled={savingId === `workspace-${row.id}`}
                  onChange={(e) =>
                    void updateWorkspaceRow(row.id, {
                      paymentStatus: e.target.value as "PENDING" | "PROCESSING" | "PAID" | "FAILED"
                    })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
              ) : (
                <span>—</span>
              )
          },
          {
            id: "note",
            header: "Notes",
            cell: (row) => (
              <input
                className="min-w-[220px]"
                defaultValue={row.decisionReason ?? ""}
                placeholder="Internal note"
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value === (row.decisionReason ?? "")) return;
                  void updateWorkspaceRow(row.id, { internalNote: value });
                }}
              />
            )
          },
          {
            id: "deliverables",
            header: "Deliverables",
            cell: (row) => (
              <button
                type="button"
                className="btn ghost text-xs"
                onClick={() =>
                  setExpandedRows((prev) =>
                    prev.includes(row.id) ? prev.filter((x) => x !== row.id) : Array.from(new Set([...prev, row.id]))
                  )
                }
              >
                {row.contract?.deliverables?.length ?? 0} {expandedRows.includes(row.id) ? "Hide" : "View"}
              </button>
            )
          }
        ]}
      />

      {filteredRows
        .filter((row) => expandedRows.includes(row.id))
        .map((row) => (
          <div key={`expanded-${row.id}`} className="rounded-xl border border-[#d0d7e2] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="section-title m-0">{row.creator.fullName} deliverables</h3>
              {row.contract ? (
                <div className="row">
                  <button
                    className="btn secondary"
                    disabled={savingId === `contract-${row.contract.id}`}
                    onClick={() => void reviewAllDeliverables(row.contract!.id, "APPROVE")}
                  >
                    Approve all
                  </button>
                  <button
                    className="btn ghost"
                    disabled={savingId === `contract-${row.contract.id}`}
                    onClick={() => void reviewAllDeliverables(row.contract!.id, "REQUEST_REVISION")}
                  >
                    Request revisions all
                  </button>
                </div>
              ) : null}
            </div>
            {!row.contract || row.contract.deliverables.length === 0 ? (
              <p className="muted m-0">No deliverables yet.</p>
            ) : (
              <div className="table-scroller">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left">Slot</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.contract.deliverables.map((d) => (
                      <tr key={d.id} className="border-b border-border/50">
                        <td className="px-3 py-2">{d.slotIndex ?? "—"}</td>
                        <td className="px-3 py-2">{d.expectedKind ?? "—"}</td>
                        <td className="px-3 py-2">{d.status}</td>
                        <td className="px-3 py-2">
                          <div className="row">
                            <button
                              className="btn secondary"
                              disabled={savingId === d.id}
                              onClick={() => void reviewDeliverable(d.id, "APPROVE")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn ghost"
                              disabled={savingId === d.id}
                              onClick={() => void reviewDeliverable(d.id, "REQUEST_REVISION")}
                            >
                              Revision
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

      {message ? <p className="help text-[#334155]">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

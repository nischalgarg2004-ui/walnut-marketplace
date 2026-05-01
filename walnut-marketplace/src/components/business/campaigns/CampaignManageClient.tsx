"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Toast from "@/components/ui/Toast";
import { CreatorPreviewSheet } from "@/components/business/campaigns/CreatorPreviewSheet";

type CreatorRow = {
  id: string;
  fullName: string;
  instagramUsername: string | null;
  instagramHandle: string | null;
  instagramProfilePictureUrl: string | null;
  followerCount: number;
};

type ApplicationRow = {
  id: string;
  status: "APPLIED" | "WAITLISTED" | "APPROVED" | "REJECTED";
  clippingLifecycleStatus?: string | null;
  clippingSampleUrl?: string | null;
  clippingFinalUrl?: string | null;
  clippingDestinationHandle?: string | null;
  auditTrail?: Array<{
    action: string;
    createdAt: string;
    metadata?: { reason?: string | null } | null;
  }>;
  pitch: string | null;
  appliedAt: string;
  creator: CreatorRow;
  contract: null | {
    id: string;
    status: string;
    deliverables: { id: string; status: string }[];
    barterShipment: { status: string } | null;
    performanceReport: { viewsCount: number } | null;
  };
};

type RequirementHeader = {
  id: string;
  title: string;
  status: string;
  category?: "UGC" | "CLIPPING";
  brief: string;
};

type ReviewTemplate = { id: string; label: string; text: string };

type ReviewDialogState = {
  applicationId: string;
  mode: "APPLICATION_REJECT" | "APPLICATION_WAITLIST" | "CLIPPING_REVISION";
  title: string;
  submitLabel: string;
  templates: ReviewTemplate[];
  selectedTemplateId: string;
  reason: string;
};

const APPLICATION_REJECT_TEMPLATES: ReviewTemplate[] = [
  {
    id: "hook_quality",
    label: "Hook quality",
    text: "Hook quality below benchmark. Please rework opening 3 seconds and pacing."
  },
  {
    id: "brand_safety",
    label: "Brand safety",
    text: "Brand safety/compliance mismatch with campaign rules. Please remove restricted references and re-submit."
  },
  {
    id: "cta_compliance",
    label: "CTA/instructions",
    text: "CTA and posting instructions were not followed. Please align to campaign format and call-to-action rules."
  }
];

const APPLICATION_WAITLIST_TEMPLATES: ReviewTemplate[] = [
  {
    id: "slot_release",
    label: "Waiting for slot release",
    text: "Shortlisted and currently on waitlist while active slots are being finalized."
  },
  {
    id: "backup_batch",
    label: "Backup batch",
    text: "Shortlisted as backup creator for this campaign batch."
  }
];

const CLIPPING_REVISION_TEMPLATES: ReviewTemplate[] = [
  {
    id: "clip_hook",
    label: "Hook improvement needed",
    text: "Please strengthen the hook and tighten edits in the first 3-5 seconds."
  },
  {
    id: "edit_compliance",
    label: "Edit compliance mismatch",
    text: "Please align clip style and pacing with the provided clipping instructions."
  },
  {
    id: "account_match",
    label: "Account/publish mismatch",
    text: "Ensure final publish is made from your connected destination Instagram handle."
  }
];

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

function displayHandle(c: CreatorRow): string {
  return c.instagramUsername ?? c.instagramHandle ?? "";
}

export function CampaignManageClient({ requirementId }: { requirementId: string }) {
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const [requirement, setRequirement] = useState<RequirementHeader | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"received" | "accepted" | "other">("received");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/business/requirements/${requirementId}/applications`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setLoadError(json.error ?? "Failed to load");
      setRequirement(null);
      setApplications([]);
      return;
    }
    setLoadError("");
    setRequirement(json.data.requirement);
    setApplications(json.data.applications);
  }, [requirementId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!creatorParam || applications.length === 0) return;
    const target = applications.find((app) => app.creator.id === creatorParam);
    if (target) {
      setPreviewId(target.creator.id);
    }
  }, [applications, creatorParam]);

  async function decide(id: string, status: "APPROVED" | "REJECTED" | "WAITLISTED", reason?: string) {
    setUpdating(true);
    const res = await fetch(`/api/applications/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason })
    });
    const json = await res.json();
    setUpdating(false);
    if (!res.ok) {
      setToast({ message: json.error ?? "Update failed", type: "error" });
      return;
    }
    setToast({ message: `Updated to ${status}.`, type: "success" });
    await load();
  }

  async function updateClippingStatus(
    applicationId: string,
    clippingLifecycleStatus:
      | "REVISION_REQUESTED"
      | "APPROVED_FOR_PUBLISH"
      | "VERIFIED"
      | "PAID",
    reason?: string
  ) {
    setUpdating(true);
    const res = await fetch(`/api/business/applications/${applicationId}/workspace`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clippingLifecycleStatus,
        clippingReviewReason: reason?.trim() || undefined
      })
    });
    const json = await res.json();
    setUpdating(false);
    if (!res.ok) {
      setToast({ message: json.error ?? "Clipping update failed", type: "error" });
      return;
    }
    setToast({ message: `Clipping state updated to ${clippingLifecycleStatus}.`, type: "success" });
    await load();
  }

  function openReviewDialog(params: {
    applicationId: string;
    mode: ReviewDialogState["mode"];
    title: string;
    submitLabel: string;
    templates: ReviewTemplate[];
  }) {
    const first = params.templates[0];
    setReviewDialog({
      applicationId: params.applicationId,
      mode: params.mode,
      title: params.title,
      submitLabel: params.submitLabel,
      templates: params.templates,
      selectedTemplateId: first?.id ?? "custom",
      reason: first?.text ?? ""
    });
  }

  async function submitReviewDialog() {
    if (!reviewDialog) return;
    const reason = reviewDialog.reason.trim();
    if (!reason) {
      setToast({ message: "Please add a reason before submitting.", type: "error" });
      return;
    }
    const modal = reviewDialog;
    setReviewDialog(null);
    if (modal.mode === "APPLICATION_REJECT") {
      await decide(modal.applicationId, "REJECTED", reason);
      return;
    }
    if (modal.mode === "APPLICATION_WAITLIST") {
      await decide(modal.applicationId, "WAITLISTED", reason);
      return;
    }
    await updateClippingStatus(modal.applicationId, "REVISION_REQUESTED", reason);
  }

  const rows = useMemo(() => {
    if (tab === "received") {
      return applications.filter((a) => a.status === "APPLIED" || a.status === "WAITLISTED");
    }
    if (tab === "accepted") {
      return applications.filter((a) => a.status === "APPROVED");
    }
    return applications.filter((a) => a.status === "REJECTED");
  }, [applications, tab]);

  const counts = useMemo(() => {
    return {
      received: applications.filter((a) => a.status === "APPLIED" || a.status === "WAITLISTED").length,
      accepted: applications.filter((a) => a.status === "APPROVED").length,
      other: applications.filter((a) => a.status === "REJECTED").length
    };
  }, [applications]);

  if (loading && !requirement) {
    return (
      <div className="stack">
        <div className="skeleton skeleton-card h-32" />
        <div className="skeleton skeleton-card h-64" />
      </div>
    );
  }

  if (loadError || !requirement) {
    return (
      <div className="card">
        <p className="m-0 text-destructive">{loadError || "Not found"}</p>
        <Link href="/business/campaigns" className="btn ghost mt-3 inline-block">
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card hero">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign</p>
            <h1 className="title m-0">{requirement.title}</h1>
            <p className="subtitle m-0 mt-1 line-clamp-2">{requirement.brief}</p>
          </div>
          <span className="pill w-fit">{requirement.status}</span>
        </div>
        <Link href="/business/campaigns" className="btn ghost mt-4 inline-flex w-fit text-sm">
          ← Back to campaigns
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            ["received", `Received (${counts.received})`],
            ["accepted", `Accepted (${counts.accepted})`],
            ["other", `Rejected (${counts.other})`]
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 z-[1] bg-muted/40 px-3 py-3 font-medium">Creator</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Applied</th>
              <th className="px-3 py-3 font-medium">Pitch</th>
              {requirement.category === "CLIPPING" ? (
                <th className="px-3 py-3 font-medium">Clipping</th>
              ) : null}
              {tab === "accepted" ? (
                <>
                  <th className="px-3 py-3 font-medium">Deal</th>
                  <th className="px-3 py-3 font-medium">Deliverables</th>
                </>
              ) : null}
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={tab === "accepted" ? 8 : requirement.category === "CLIPPING" ? 6 : 5} className="px-3 py-8 text-center text-muted-foreground">
                  No rows in this view.
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-b border-border/80 hover:bg-muted/20">
                  <td className="sticky left-0 z-[1] bg-card px-3 py-3 align-top">
                    <button
                      type="button"
                      className="flex max-w-[220px] items-center gap-2 text-left"
                      onClick={() => setPreviewId(a.creator.id)}
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {a.creator.instagramProfilePictureUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.creator.instagramProfilePictureUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                            {initials(a.creator.fullName)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{a.creator.fullName}</span>
                        {displayHandle(a.creator) ? (
                          <span className="block truncate text-xs text-primary">@{displayHandle(a.creator)}</span>
                        ) : (
                          <span className="block text-xs text-muted-foreground">No handle</span>
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-muted-foreground">
                    {new Date(a.appliedAt).toLocaleString()}
                  </td>
                  <td className="max-w-xs px-3 py-3 align-top text-muted-foreground">
                    <span className="line-clamp-3">{a.pitch ?? "—"}</span>
                  </td>
                  {requirement.category === "CLIPPING" ? (
                    <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                      <span className="block font-medium text-foreground">
                        {a.clippingLifecycleStatus ?? "SOURCE_RECEIVED"}
                      </span>
                      {a.clippingDestinationHandle ? (
                        <span className="block">Dest: @{a.clippingDestinationHandle}</span>
                      ) : null}
                      {a.clippingSampleUrl ? <span className="block">Sample: submitted</span> : null}
                      {a.clippingFinalUrl ? <span className="block">Final: submitted</span> : null}
                      {a.auditTrail && a.auditTrail.length > 0 ? (
                        <div className="mt-2 space-y-1 border-t border-border pt-2">
                          {a.auditTrail.slice(0, 3).map((log, idx) => (
                            <p key={`${log.action}-${idx}`} className="m-0 text-[11px] leading-relaxed text-muted-foreground">
                              <span className="font-medium text-foreground">{log.action}</span>
                              {" · "}
                              {new Date(log.createdAt).toLocaleString()}
                              {log.metadata?.reason ? ` · ${log.metadata.reason}` : ""}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                  {tab === "accepted" ? (
                    <>
                      <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                        {a.contract ? (
                          <>
                            <span className="font-medium text-foreground">{a.contract.status}</span>
                            {a.contract.barterShipment ? (
                              <span className="block">Shipment: {a.contract.barterShipment.status}</span>
                            ) : null}
                            {a.contract.performanceReport ? (
                              <span className="block">Views: {a.contract.performanceReport.viewsCount}</span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-xs">
                        {a.contract?.deliverables?.length ? (
                          <span>
                            {
                              a.contract.deliverables.filter((d) => d.status === "APPROVED" || d.status === "PUBLISHED")
                                .length
                            }
                            /{a.contract.deliverables.length} done
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </>
                  ) : null}
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
                      {a.status === "APPLIED" || a.status === "WAITLISTED" ? (
                        <>
                          <button
                            type="button"
                            className="btn primary text-xs"
                            disabled={updating}
                            onClick={() => void decide(a.id, "APPROVED")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn secondary text-xs"
                            disabled={updating}
                            onClick={() =>
                              openReviewDialog({
                                applicationId: a.id,
                                mode: "APPLICATION_WAITLIST",
                                title: "Waitlist with reason",
                                submitLabel: "Set waitlist reason",
                                templates: APPLICATION_WAITLIST_TEMPLATES
                              })
                            }
                          >
                            Waitlist
                          </button>
                          <button
                            type="button"
                            className="btn danger text-xs"
                            disabled={updating}
                            onClick={() =>
                              openReviewDialog({
                                applicationId: a.id,
                                mode: "APPLICATION_REJECT",
                                title: "Reject with reason",
                                submitLabel: "Reject application",
                                templates: APPLICATION_REJECT_TEMPLATES
                              })
                            }
                          >
                            Reject
                          </button>
                        </>
                      ) : a.status === "APPROVED" ? (
                        <>
                          <button
                            type="button"
                            className="btn danger text-xs"
                            disabled={updating}
                            onClick={() =>
                              openReviewDialog({
                                applicationId: a.id,
                                mode: "APPLICATION_REJECT",
                                title: "Reject with reason",
                                submitLabel: "Reject application",
                                templates: APPLICATION_REJECT_TEMPLATES
                              })
                            }
                          >
                            Reject
                          </button>
                          {requirement.category === "CLIPPING" ? (
                            <>
                              <button
                                type="button"
                                className="btn secondary text-xs"
                                disabled={updating}
                                onClick={() =>
                                  openReviewDialog({
                                    applicationId: a.id,
                                    mode: "CLIPPING_REVISION",
                                    title: "Request clipping revision",
                                    submitLabel: "Send revision request",
                                    templates: CLIPPING_REVISION_TEMPLATES
                                  })
                                }
                              >
                                Request revision
                              </button>
                              <button
                                type="button"
                                className="btn secondary text-xs"
                                disabled={updating}
                                onClick={() => void updateClippingStatus(a.id, "APPROVED_FOR_PUBLISH")}
                              >
                                Approve sample
                              </button>
                              <button
                                type="button"
                                className="btn secondary text-xs"
                                disabled={updating}
                                onClick={() => void updateClippingStatus(a.id, "VERIFIED")}
                              >
                                Verify publish
                              </button>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreatorPreviewSheet
        creatorId={previewId}
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
      />
      {reviewDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-4 shadow-xl">
            <h2 className="m-0 text-base font-semibold text-foreground">{reviewDialog.title}</h2>
            <p className="m-0 mt-1 text-xs text-muted-foreground">
              Pick a template, then fine-tune the message before sending.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reviewDialog.templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs ${
                    reviewDialog.selectedTemplateId === template.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() =>
                    setReviewDialog((prev) =>
                      prev
                        ? {
                            ...prev,
                            selectedTemplateId: template.id,
                            reason: template.text
                          }
                        : prev
                    )
                  }
                >
                  {template.label}
                </button>
              ))}
            </div>
            <textarea
              className="form-full mt-3 min-h-[120px]"
              value={reviewDialog.reason}
              onChange={(e) =>
                setReviewDialog((prev) =>
                  prev
                    ? {
                        ...prev,
                        selectedTemplateId: "custom",
                        reason: e.target.value
                      }
                    : prev
                )
              }
              placeholder="Enter decision reason..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="btn ghost text-xs" onClick={() => setReviewDialog(null)}>
                Cancel
              </button>
              <button type="button" className="btn primary text-xs" onClick={() => void submitReviewDialog()}>
                {reviewDialog.submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}

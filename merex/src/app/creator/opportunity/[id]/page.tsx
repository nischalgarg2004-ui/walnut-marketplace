"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/ui/Toast";
import { labelDeliverableSlotRows, slotsForOpportunityView } from "@/lib/deliverable-slots";

type Opportunity = {
  id: string;
  title: string;
  brief: string;
  deliverableSlots?: unknown;
  deliverableCount?: number;
  deliverableKind?: string | null;
  category?: "UGC" | "CLIPPING";
  clippingMeta?: { sourceItems?: Array<{ type?: string; url?: string; label?: string }> } | null;
  business?: { brandName?: string };
  eligibility?: {
    minFollowers: number;
    minEngagementRate: number | null;
    niches: string[];
    allowedLocations: string[];
    genderAllowed?: string[];
  };
  compensation?: {
    fixedFeeAmount: string | null;
    cpvRatePer1000: string | null;
    hasBarter: boolean;
    barterNotes?: string | null;
  };
};

type ExistingApplication = {
  id: string;
  requirement: { id: string; category?: "UGC" | "CLIPPING" };
  clippingLifecycleStatus?: string | null;
  clippingSampleUrl?: string | null;
  clippingFinalUrl?: string | null;
  clippingDestinationHandle?: string | null;
  decisionReason?: string | null;
};

function creatorGenderCopy(genderAllowed: string[] | undefined): string {
  if (!genderAllowed || genderAllowed.length === 0) return "Any creator gender may apply.";
  if (genderAllowed.includes("male") && !genderAllowed.includes("female")) return "Only male creators may apply.";
  if (genderAllowed.includes("female") && !genderAllowed.includes("male")) return "Only female creators may apply.";
  return "See creator gender rules on your profile.";
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Opportunity | null>(null);
  const [pitch, setPitch] = useState("");
  const [step, setStep] = useState<"form" | "terms" | "barter">("form");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [barterAck, setBarterAck] = useState(false);
  const [shippingFullName, setShippingFullName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [addressShareAck, setAddressShareAck] = useState(false);
  const [applying, setApplying] = useState(false);
  const [connectedHandle, setConnectedHandle] = useState("");
  const [destinationHandle, setDestinationHandle] = useState("");
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const [sampleUrl, setSampleUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [submittingClip, setSubmittingClip] = useState<"SAMPLE" | "FINAL" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  const deliverableRows = useMemo(() => {
    if (!item) return [];
    const slots = slotsForOpportunityView({
      deliverableSlots: item.deliverableSlots,
      deliverableCount: item.deliverableCount,
      deliverableKind: item.deliverableKind
    });
    return labelDeliverableSlotRows(slots);
  }, [item]);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!me.ok || !meData.data?.instagramConnected) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      if (meData.data?.onboardingRequired) {
        window.location.assign("/creator/profile?onboarding=1");
        return;
      }
      const profileRes = await fetch("/api/profiles/creator");
      const profileJson = await profileRes.json();
      if (profileRes.ok && profileJson.data) {
        const p = profileJson.data as {
          fullName?: string;
          city?: string | null;
          state?: string | null;
        };
        setShippingFullName(p.fullName ?? "");
        setShippingCity(p.city ?? "");
        setShippingState(p.state ?? "");
        const handle = (profileJson.data.instagramUsername ?? profileJson.data.instagramHandle ?? "")
          .replace(/^@/, "");
        setConnectedHandle(handle);
        setDestinationHandle(handle);
      }
      const appsRes = await fetch("/api/creator/applications");
      const appsJson = await appsRes.json();
      if (appsRes.ok && Array.isArray(appsJson.data)) {
        const existing = appsJson.data.find((a: ExistingApplication) => a.requirement?.id === id) ?? null;
        setExistingApplication(existing);
        if (existing?.clippingDestinationHandle) {
          setDestinationHandle(existing.clippingDestinationHandle);
        }
      }
      const response = await fetch(`/api/requirements/${id}`);
      const result = await response.json();
      if (!response.ok) {
        setToast({ message: result.error ?? "Unable to load opportunity", type: "error" });
        return;
      }
      setItem(result.data);
    })();
  }, [id]);

  async function submitApply() {
    if (!item) return;
    if (!termsAccepted) {
      setToast({ message: "Confirm you have read the opportunity terms.", type: "error" });
      return;
    }
    if (item.compensation?.hasBarter) {
      if (!barterAck) {
        setToast({ message: "Confirm barter handoff acknowledgment.", type: "error" });
        return;
      }
      if (!addressShareAck) {
        setToast({ message: "Confirm you consent to share your shipping address with the brand.", type: "error" });
        return;
      }
      if (
        !shippingFullName.trim() ||
        !shippingPhone.trim() ||
        !shippingLine1.trim() ||
        !shippingCity.trim() ||
        !shippingState.trim() ||
        !shippingPincode.trim()
      ) {
        setToast({ message: "Fill in your full shipping address.", type: "error" });
        return;
      }
    }
    setApplying(true);
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementId: item.id,
        pitch,
        clippingDestinationHandle: item.category === "CLIPPING" ? destinationHandle : undefined,
        acceptedTerms: true as const,
        barterAccessAcknowledged: item.compensation?.hasBarter ? barterAck : undefined,
        shipping: item.compensation?.hasBarter
          ? {
              shippingFullName: shippingFullName.trim(),
              shippingPhone: shippingPhone.trim(),
              shippingLine1: shippingLine1.trim(),
              shippingLine2: shippingLine2.trim() || undefined,
              shippingCity: shippingCity.trim(),
              shippingState: shippingState.trim(),
              shippingPincode: shippingPincode.trim(),
              addressShareAcknowledged: true as const
            }
          : undefined
      })
    });
    const result = await response.json();
    setToast({
      message: response.ok ? "Application submitted." : `Failed: ${result.error}`,
      type: response.ok ? "success" : "error"
    });
    setApplying(false);
    if (response.ok) {
      setStep("form");
    }
  }

  async function submitClipping(stage: "SAMPLE" | "FINAL") {
    if (!existingApplication) return;
    const url = stage === "SAMPLE" ? sampleUrl.trim() : finalUrl.trim();
    if (!url) {
      setToast({ message: "Add a valid URL before submitting.", type: "error" });
      return;
    }
    setSubmittingClip(stage);
    const res = await fetch(`/api/creator/applications/${existingApplication.id}/clipping-submit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, url })
    });
    const json = await res.json();
    setSubmittingClip(null);
    if (!res.ok) {
      setToast({ message: json.error ?? "Submission failed", type: "error" });
      return;
    }
    setExistingApplication((prev) => (prev ? { ...prev, ...json.data } : prev));
    setToast({
      message: stage === "SAMPLE" ? "Sample submitted for review." : "Final post URL submitted.",
      type: "success"
    });
  }

  function startApply() {
    if (!item) return;
    setStep("terms");
  }

  function confirmTerms() {
    if (!termsAccepted) {
      setToast({ message: "Check the box to confirm you read the terms.", type: "error" });
      return;
    }
    if (!item?.compensation?.hasBarter) {
      void submitApply();
      return;
    }
    setStep("barter");
  }

  function confirmBarter() {
    void submitApply();
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">{item?.title ?? "Opportunity"}</h1>
        <p className="subtitle">Brand: {item?.business?.brandName ?? "Unknown"}</p>
      </div>
      <div className="card">
        <p className="muted">{item?.brief ?? "Loading..."}</p>
        {item && deliverableRows.length > 0 ? (
          <div className="mt-5 border-t border-border pt-5">
            <h2 className="section-title">Deliverables</h2>
            <p className="section-subtitle m-0">What the brand expects, in order—plus any note they left for each slot.</p>
            <ol className="mt-4 list-none space-y-3 p-0">
              {deliverableRows.map((row) => (
                <li
                  key={`${row.label}-${row.kind}`}
                  className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                >
                  <p className="m-0 font-semibold text-foreground">{row.label}</p>
                  {row.note ? (
                    <p className="muted mt-2 m-0 whitespace-pre-wrap leading-relaxed">{row.note}</p>
                  ) : (
                    <p className="muted mt-2 m-0 italic">No per-slot note from the brand.</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {item?.eligibility ? (
          <p className="muted mt-5 border-t border-border pt-5">
            <span className="font-medium text-foreground">Creator eligibility: </span>
            {creatorGenderCopy(item.eligibility.genderAllowed)} Min followers {item.eligibility.minFollowers}. Min
            engagement {item.eligibility.minEngagementRate ?? "not set"}%.
            {item.eligibility.niches?.length ? (
              <>
                {" "}
                Niches: {item.eligibility.niches.join(", ")}.
              </>
            ) : null}
          </p>
        ) : null}
        {item?.compensation ? (
          <p className="muted">
            Compensation: Fixed {item.compensation.fixedFeeAmount ?? 0}, CPV/1000{" "}
            {item.compensation.cpvRatePer1000 ?? 0}, Barter {item.compensation.hasBarter ? "Yes" : "No"}
          </p>
        ) : null}
        {item?.compensation?.hasBarter && item.compensation.barterNotes ? (
          <p className="muted">Barter notes: {item.compensation.barterNotes}</p>
        ) : null}

        {item?.category === "CLIPPING" && item.clippingMeta?.sourceItems?.length ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="m-0 text-sm font-semibold text-foreground">Clipping sources</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {item.clippingMeta.sourceItems.slice(0, 8).map((src, idx) => (
                <li key={`${src.url}-${idx}`}>
                  {(src.label || src.type || "Source").toString()}: {src.url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === "form" && (
          <>
            <textarea
              className="form-full"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Optional pitch"
            />
            <button className="btn primary" onClick={startApply} disabled={!item}>
              Continue to apply
            </button>
            {item?.category === "CLIPPING" ? (
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <label className="mb-1 block text-xs font-medium text-foreground">Destination Instagram handle (must match connected account)</label>
                <input value={destinationHandle} onChange={(e) => setDestinationHandle(e.target.value.replace(/^@/, ""))} placeholder="your_handle" />
                <p className="m-0 mt-1 text-xs text-muted-foreground">
                  Connected account: @{connectedHandle || "not connected"}
                </p>
              </div>
            ) : null}
          </>
        )}

        {step === "terms" && (
          <div className="stack">
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />{" "}
                I have read this opportunity&apos;s brief and eligibility rules and agree to the brand&apos;s
                requirements.
              </label>
            </p>
            <div className="row">
              <button className="btn ghost" type="button" onClick={() => setStep("form")}>
                Back
              </button>
              <button className="btn primary" type="button" onClick={confirmTerms} disabled={applying}>
                {item?.compensation?.hasBarter ? "Continue" : applying ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        )}

        {step === "barter" && (
          <div className="stack">
            <p className="muted">
              This campaign includes a barter component. Product will be shipped to you. Provide the address where you can
              receive it. Profile district is used for matching; this address is for fulfillment and may differ.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="form-full sm:col-span-2"
                value={shippingFullName}
                onChange={(e) => setShippingFullName(e.target.value)}
                placeholder="Full name"
              />
              <input
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                placeholder="Phone"
                inputMode="tel"
              />
              <input
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value)}
                placeholder="PIN code"
              />
              <input
                className="form-full sm:col-span-2"
                value={shippingLine1}
                onChange={(e) => setShippingLine1(e.target.value)}
                placeholder="Address line 1"
              />
              <input
                className="form-full sm:col-span-2"
                value={shippingLine2}
                onChange={(e) => setShippingLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
              />
              <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City" />
              <input value={shippingState} onChange={(e) => setShippingState(e.target.value)} placeholder="State" />
            </div>
            <p>
              <label>
                <input type="checkbox" checked={barterAck} onChange={(e) => setBarterAck(e.target.checked)} /> I
                understand and agree to coordinate product handoff only through Merex—never share unrelated account
                passwords or sensitive credentials.
              </label>
            </p>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={addressShareAck}
                  onChange={(e) => setAddressShareAck(e.target.checked)}
                />{" "}
                I consent to share this shipping address with the brand for fulfillment.
              </label>
            </p>
            <div className="row">
              <button className="btn ghost" type="button" onClick={() => setStep("terms")}>
                Back
              </button>
              <button className="btn primary" type="button" onClick={confirmBarter} disabled={applying}>
                {applying ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        )}

        {existingApplication && item?.category === "CLIPPING" ? (
          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <p className="m-0 text-sm font-semibold text-foreground">Clipping submission workspace</p>
            <p className="m-0 mt-1 text-xs text-muted-foreground">
              Lifecycle: {existingApplication.clippingLifecycleStatus ?? "SOURCE_RECEIVED"}
            </p>
            {existingApplication.clippingLifecycleStatus === "REVISION_REQUESTED" ? (
              <div className="mt-2 rounded-md border border-amber-300/60 bg-amber-50 px-2 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="m-0 font-medium">Revision requested</p>
                <p className="m-0 mt-1">
                  {existingApplication.decisionReason?.trim() ||
                    "Please improve the clip quality and resubmit the relevant URL."}
                </p>
              </div>
            ) : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="m-0 text-xs font-medium text-foreground">Sample clip</p>
                <input
                  className="mt-2"
                  value={sampleUrl}
                  onChange={(e) => setSampleUrl(e.target.value)}
                  placeholder="https://..."
                />
                <button
                  type="button"
                  className="btn secondary mt-2 text-xs"
                  disabled={submittingClip !== null}
                  onClick={() => void submitClipping("SAMPLE")}
                >
                  {submittingClip === "SAMPLE" ? "Submitting..." : "Submit sample"}
                </button>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="m-0 text-xs font-medium text-foreground">Final Instagram post URL</p>
                <input
                  className="mt-2"
                  value={finalUrl}
                  onChange={(e) => setFinalUrl(e.target.value)}
                  placeholder="https://www.instagram.com/..."
                />
                <button
                  type="button"
                  className="btn primary mt-2 text-xs"
                  disabled={submittingClip !== null}
                  onClick={() => void submitClipping("FINAL")}
                >
                  {submittingClip === "FINAL" ? "Submitting..." : "Submit final"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

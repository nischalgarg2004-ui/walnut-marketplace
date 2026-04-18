"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

type Opportunity = {
  id: string;
  title: string;
  brief: string;
  business?: { brandName?: string };
  eligibility?: {
    minFollowers: number;
    minEngagementRate: number | null;
    niches: string[];
    allowedLocations: string[];
  };
  compensation?: {
    fixedFeeAmount: string | null;
    cpvRatePer1000: string | null;
    hasBarter: boolean;
    barterNotes?: string | null;
  };
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Opportunity | null>(null);
  const [pitch, setPitch] = useState("");
  const [step, setStep] = useState<"form" | "terms" | "barter">("form");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [barterAck, setBarterAck] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" }>({
    message: "",
    type: "info"
  });

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!me.ok || !meData.data?.instagramConnected) {
        window.location.assign("/creator/connect-instagram");
        return;
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
    if (item.compensation?.hasBarter && !barterAck) {
      setToast({ message: "Confirm barter handoff acknowledgment.", type: "error" });
      return;
    }
    setApplying(true);
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirementId: item.id,
        pitch,
        acceptedTerms: true as const,
        barterAccessAcknowledged: item.compensation?.hasBarter ? barterAck : undefined
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
    if (!barterAck) {
      setToast({ message: "Confirm barter acknowledgment to continue.", type: "error" });
      return;
    }
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
        {item?.eligibility ? (
          <p className="muted">
            Eligibility: Min followers {item.eligibility.minFollowers}, Min engagement{" "}
            {item.eligibility.minEngagementRate ?? "not set"}%
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
              This campaign includes a barter component. You agree to coordinate product handoff only through Walnut
              (shipping address or brand workflow)—never share unrelated account passwords or sensitive credentials.
            </p>
            <p>
              <label>
                <input type="checkbox" checked={barterAck} onChange={(e) => setBarterAck(e.target.checked)} /> I
                understand and agree to the barter handoff terms above.
              </label>
            </p>
            <div className="row">
              <button className="btn ghost" type="button" onClick={() => setStep("terms")}>
                Back
              </button>
              <button className="btn primary" type="button" onClick={confirmBarter} disabled={applying}>
                {applying ? "Submitting…" : "Acknowledge & submit"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";

export default function BusinessRequirementsPage() {
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Creating requirement...");
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      brief: String(form.get("brief") ?? ""),
      platforms: String(form.get("platforms") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      contentType: String(form.get("contentType") ?? "ugc"),
      deliverableCount: Number(form.get("deliverableCount") ?? 1),
      status: "PUBLISHED",
      eligibility: {
        genderAllowed: String(form.get("genderAllowed") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        minFollowers: Number(form.get("minFollowers") ?? 0),
        minEngagementRate: Number(form.get("minEngagementRate") ?? 0),
        allowedLocations: String(form.get("allowedLocations") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        niches: String(form.get("niches") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      },
      compensation: {
        hasBarter: form.get("hasBarter") === "on",
        barterNotes: String(form.get("barterNotes") ?? ""),
        fixedFeeAmount: Number(form.get("fixedFeeAmount") ?? 0),
        cpvRatePer1000: Number(form.get("cpvRatePer1000") ?? 0),
        currency: "INR"
      }
    };

    const response = await fetch("/api/requirements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? `Created: ${result.data.title}` : `Failed: ${result.error}`);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Create Brand Requirement</h1>
        <p className="subtitle">
          Define audience eligibility and compensation terms clearly for faster high-quality creator
          matching.
        </p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="form-grid">
          <input className="form-full" name="title" placeholder="Requirement title" required />
          <textarea className="form-full" name="brief" placeholder="Brief and deliverable context" required />
          <input name="platforms" placeholder="Platforms: instagram,youtube" required />
          <input name="contentType" placeholder="Content type" defaultValue="ugc" />
          <input name="deliverableCount" type="number" min={1} defaultValue={1} />
          <input name="genderAllowed" placeholder="Gender filter: female,male" />
          <input name="minFollowers" type="number" min={0} defaultValue={0} />
          <input name="minEngagementRate" type="number" min={0} step="0.1" defaultValue={0} />
          <input name="allowedLocations" placeholder="Locations: mumbai,delhi" />
          <input name="niches" placeholder="Niches: beauty,skincare" />
          <label className="pill">
            <input name="hasBarter" type="checkbox" /> Include barter
          </label>
          <input className="form-full" name="barterNotes" placeholder="Barter notes (if applicable)" />
          <input name="fixedFeeAmount" type="number" min={0} defaultValue={0} placeholder="Fixed fee (INR)" />
          <input name="cpvRatePer1000" type="number" min={0} defaultValue={0} placeholder="CPV / 1,000 views" />
          <div className="form-full row">
            <button className="btn primary" type="submit">
              Publish Requirement
            </button>
          </div>
        </form>
        <p className="help">{message}</p>
      </div>
    </section>
  );
}

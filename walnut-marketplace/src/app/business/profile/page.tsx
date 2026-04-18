"use client";

import { FormEvent, useState } from "react";

export default function BusinessProfilePage() {
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      legalName: String(form.get("legalName") ?? ""),
      brandName: String(form.get("brandName") ?? ""),
      gstinPlaceholder: String(form.get("gstinPlaceholder") ?? ""),
      website: String(form.get("website") ?? ""),
      category: String(form.get("category") ?? ""),
      billingEmail: String(form.get("billingEmail") ?? "")
    };

    const response = await fetch("/api/profiles/business", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? `Saved profile: ${result.data.brandName}` : `Failed: ${result.error}`);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Business Profile</h1>
        <p className="subtitle">Keep your brand identity and billing metadata accurate for trust and payouts.</p>
      </div>
      <div className="card">
        <form onSubmit={onSubmit} className="form-grid">
          <input name="legalName" placeholder="Legal name" required />
          <input name="brandName" placeholder="Brand name" required />
          <input name="gstinPlaceholder" placeholder="GSTIN placeholder" />
          <input name="website" placeholder="Website URL" />
          <input name="category" placeholder="Category" />
          <input name="billingEmail" placeholder="Billing email" />
          <div className="form-full">
            <button className="btn primary" type="submit">
              Save Profile
            </button>
          </div>
        </form>
        <p className="help">{message}</p>
      </div>
    </section>
  );
}

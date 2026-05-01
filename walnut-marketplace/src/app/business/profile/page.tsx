"use client";

import { FormEvent, useEffect, useState } from "react";

type BusinessRow = {
  legalName: string;
  brandName: string;
  gstinPlaceholder: string | null;
  website: string | null;
  category: string | null;
  billingEmail: string | null;
  representativeFullName: string | null;
  representativeDateOfBirth: string | null;
};

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

function ageFromDob(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [legalName, setLegalName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [gstinPlaceholder, setGstinPlaceholder] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [representativeFullName, setRepresentativeFullName] = useState("");
  const [representativeDob, setRepresentativeDob] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profiles/business");
      const json = await res.json();
      setLoading(false);
      if (!res.ok || !json.data) return;
      const p = json.data as BusinessRow;
      setLegalName(p.legalName);
      setBrandName(p.brandName);
      setGstinPlaceholder(p.gstinPlaceholder ?? "");
      setWebsite(p.website ?? "");
      setCategory(p.category ?? "");
      setBillingEmail(p.billingEmail ?? "");
      setRepresentativeFullName(p.representativeFullName ?? "");
      setRepresentativeDob(toDateInput(p.representativeDateOfBirth));
    })();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving…");
    const payload = {
      legalName: legalName.trim(),
      brandName: brandName.trim(),
      gstinPlaceholder: gstinPlaceholder.trim() || undefined,
      website: website.trim() || undefined,
      category: category.trim() || undefined,
      billingEmail: billingEmail.trim() || undefined,
      representativeFullName: representativeFullName.trim() || undefined,
      representativeDateOfBirth: representativeDob.trim() || undefined
    };
    const response = await fetch("/api/profiles/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? `Saved: ${result.data.brandName}` : `Failed: ${result.error}`);
  }

  const repAge = ageFromDob(representativeDob ? `${representativeDob}T12:00:00.000Z` : null);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-accent/40 via-card to-card px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div
              className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted text-2xl font-semibold text-muted-foreground shadow-md ring-2 ring-border sm:mx-0"
              aria-hidden
            >
              {brandName.trim() ? initials(brandName) : "B"}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</p>
              <h1 className="title m-0 mt-1 text-2xl">{brandName.trim() || "Your brand"}</h1>
              {representativeFullName.trim() ? (
                <p className="mt-2 m-0 text-sm text-muted-foreground">
                  Managed by <span className="font-medium text-foreground">{representativeFullName.trim()}</span>
                  {repAge !== null ? ` · ${repAge} yrs` : null}
                </p>
              ) : (
                <p className="mt-2 m-0 text-sm text-muted-foreground">Add the representative running this account.</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8 px-6 py-8 sm:px-8">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">Representative</h2>
            <p className="mt-1 m-0 text-sm text-muted-foreground">
              The person responsible for this business account on OnGram (your public-facing operator).
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full name</span>
                <input
                  className="mt-1"
                  value={representativeFullName}
                  onChange={(e) => setRepresentativeFullName(e.target.value)}
                  placeholder="Name as on ID"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Date of birth
                </span>
                <input
                  className="mt-1"
                  type="date"
                  value={representativeDob}
                  onChange={(e) => setRepresentativeDob(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <p className="m-0 text-sm text-muted-foreground">
                  {repAge !== null ? (
                    <>
                      Age: <span className="font-medium text-foreground">{repAge}</span> (from DOB)
                    </>
                  ) : (
                    "Age is calculated from date of birth."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">Brand & legal</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Legal name</span>
                <input
                  className="mt-1"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand name</span>
                <input
                  className="mt-1"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">GSTIN</span>
                <input
                  className="mt-1"
                  value={gstinPlaceholder}
                  onChange={(e) => setGstinPlaceholder(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</span>
                <input
                  className="mt-1"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</span>
                <input
                  className="mt-1"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Beauty, FMCG"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Billing contact email
                </span>
                <input
                  className="mt-1"
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="For invoices & payouts — not your login"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn primary" type="submit" disabled={loading}>
              Save profile
            </button>
            {message ? <p className="m-0 text-sm text-muted-foreground">{message}</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}

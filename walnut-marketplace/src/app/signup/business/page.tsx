"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";

export default function BusinessSignupPage() {
  const [fromInstagram, setFromInstagram] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromInstagram(params.get("from") === "instagram");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role: "BUSINESS",
        fullName: contactName,
        businessName,
        contactName
      })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Signup failed");
      setLoading(false);
      return;
    }
    window.location.assign(result.data?.next ?? "/business/home");
  }

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 3 · Business Setup"
            title={fromInstagram ? "Complete your business profile" : "Create your business workspace"}
            description={
              fromInstagram
                ? "Instagram is connected. Confirm business details and continue."
                : "Launch your team workspace for campaign publishing, application review, and payouts."
            }
            actions={
              <>
                <OnboardingProgressDots total={4} current={2} />
                <a className="btn secondary" href="/api/auth/instagram/start?mode=signup&role=business">
                  Continue with Instagram
                </a>
              </>
            }
          >
            <PagePanel title="Business details">
              <form id="business-email-signup" className="form-grid" onSubmit={onSubmit}>
                <input
                  className="form-full"
                  type="text"
                  required
                  placeholder="Business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <input
                  className="form-full"
                  type="text"
                  required
                  placeholder="Managing person name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <input
                  className="form-full"
                  type="email"
                  required
                  placeholder="Business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="form-full"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="form-full row">
                  <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Complete setup"}
                  </button>
                  <Link className="btn ghost" href="/login/business">
                    Already have an account?
                  </Link>
                </div>
              </form>
              {message ? <p className="help mt-3">{message}</p> : null}
            </PagePanel>
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}

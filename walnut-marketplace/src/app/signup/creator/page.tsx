"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";
import { RoleDefinitionHint } from "@/components/onboarding/RoleDefinitionHint";

export default function CreatorSignupPage() {
  const [fromInstagram, setFromInstagram] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [primaryPersona, setPrimaryPersona] = useState<"CREATOR" | "EDITOR_PAGE">("CREATOR");
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
      body: JSON.stringify({ email, fullName, password, role: "CREATOR", primaryPersona })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Signup failed");
      setLoading(false);
      return;
    }
    window.location.assign(result.data?.next ?? "/creator/connect-instagram");
  }

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-2xl">
          <PageScaffold
            eyebrow="Step 3 · Creator Setup"
            title={fromInstagram ? "Complete your creator profile" : "Create your creator account"}
            description={
              fromInstagram
                ? "Instagram is connected. Add only the missing details to enter your workspace."
                : "Use Instagram for faster setup, or continue with email to configure your creator workspace."
            }
            actions={
              <>
                <OnboardingProgressDots total={4} current={2} />
                <a
                  className="btn secondary"
                  href={
                    email
                      ? `/api/auth/instagram/start?mode=signup&role=creator&email=${encodeURIComponent(email)}`
                      : "/api/auth/instagram/start?mode=signup&role=creator"
                  }
                >
                  Continue with Instagram
                </a>
              </>
            }
          >
            <PagePanel title="Creator details">
              <form className="form-grid" onSubmit={onSubmit}>
                <input
                  className="form-full"
                  type="text"
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  className="form-full"
                  type="email"
                  required
                  placeholder="Email"
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
                <div className="form-full">
                  <label className="mb-1 block text-sm font-medium text-foreground">Primary profile type</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="radio"
                        name="primaryPersona"
                        checked={primaryPersona === "CREATOR"}
                        onChange={() => setPrimaryPersona("CREATOR")}
                      />
                      <span>UGC Creator</span>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="radio"
                        name="primaryPersona"
                        checked={primaryPersona === "EDITOR_PAGE"}
                        onChange={() => setPrimaryPersona("EDITOR_PAGE")}
                      />
                      <span>Editor/Clipper</span>
                    </label>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <RoleDefinitionHint
                      title="UGC Creator"
                      description="Creates original content and collaborates directly with campaign briefs."
                    />
                    <RoleDefinitionHint
                      title="Editor/Clipper"
                      description="Transforms existing footage into polished short-form edits for distribution."
                    />
                  </div>
                </div>
                <div className="form-full row">
                  <button className="btn primary" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Complete setup"}
                  </button>
                  <Link className="btn ghost" href="/login/creator">
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

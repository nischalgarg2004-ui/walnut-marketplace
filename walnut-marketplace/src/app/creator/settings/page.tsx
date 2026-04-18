"use client";

import { FormEvent, useEffect, useState } from "react";

type MePayload = {
  data?: {
    email?: string;
    instagramConnected?: boolean;
    instagramUsername?: string | null;
  };
};

export default function CreatorSettingsPage() {
  const [email, setEmail] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me");
      const result = (await response.json()) as MePayload;
      if (!response.ok) {
        window.location.assign("/login");
        return;
      }
      setEmail(result.data?.email ?? "");
      setInstagramConnected(Boolean(result.data?.instagramConnected));
      setInstagramUsername(result.data?.instagramUsername ?? null);
    })();
  }, []);

  async function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const response = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    setPasswordMessage(response.ok ? "Password updated." : `Failed: ${result.error}`);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Creator Settings</h1>
        <p className="subtitle">Manage account security and integration preferences.</p>
      </div>
      <div className="card">
        <p className="muted">Account email: {email || "Unknown"}</p>
        <p className="muted">
          Instagram: {instagramConnected ? `Connected as @${instagramUsername ?? "user"}` : "Not connected"}
        </p>
        {!instagramConnected ? (
          <a className="btn secondary" href="/api/auth/instagram/start?mode=connect">
            Connect Instagram
          </a>
        ) : null}
      </div>
      <div className="card">
        <h2 className="section-title">Set or Update Password</h2>
        <form className="form-grid" onSubmit={setPassword}>
          <input
            className="form-full"
            name="password"
            type="password"
            minLength={8}
            placeholder="New password"
            required
          />
          <div className="form-full">
            <button className="btn primary" type="submit">
              Save Password
            </button>
          </div>
        </form>
        {passwordMessage ? <p className="help">{passwordMessage}</p> : null}
      </div>
    </section>
  );
}

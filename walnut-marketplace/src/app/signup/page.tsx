"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, password })
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
    <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card hero">
        <h1 className="title">Create Creator Account</h1>
        <p className="subtitle">
          Use Instagram-first signup or create with email/password and connect Instagram afterward.
        </p>
        <a
          className="btn secondary"
          href={email ? `/api/auth/instagram/start?mode=signup&email=${encodeURIComponent(email)}` : "/api/auth/instagram/start?mode=signup"}
        >
          Continue with Instagram
        </a>
      </div>

      <div className="card">
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
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="form-full row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create with Email"}
            </button>
            <Link className="btn ghost" href="/login">
              Already have an account
            </Link>
          </div>
        </form>
        {message ? <p className="help">{message}</p> : null}
      </div>
    </section>
  );
}

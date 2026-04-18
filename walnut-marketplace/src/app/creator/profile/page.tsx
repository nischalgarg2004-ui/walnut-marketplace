"use client";

import { FormEvent, useState } from "react";

export default function CreatorProfilePage() {
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      bio: String(form.get("bio") ?? ""),
      gender: String(form.get("gender") ?? ""),
      niches: String(form.get("niches") ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      instagramHandle: String(form.get("instagramHandle") ?? ""),
      followerCount: Number(form.get("followerCount") ?? 0),
      avgEngagement: Number(form.get("avgEngagement") ?? 0)
    };

    const response = await fetch("/api/profiles/creator", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? `Saved profile: ${result.data.fullName}` : `Failed: ${result.error}`);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Creator Profile</h1>
        <p className="subtitle">
          Fill in profile quality signals so brands can evaluate eligibility and fit quickly.
        </p>
      </div>
      <div className="card">
        <form onSubmit={onSubmit} className="form-grid">
          <input name="fullName" placeholder="Full name" required />
          <input name="instagramHandle" placeholder="Instagram handle" />
          <textarea className="form-full" name="bio" placeholder="Short creator bio" />
          <input name="gender" placeholder="Gender" />
          <input name="niches" placeholder="Niches: beauty,food" />
          <input name="city" placeholder="City" />
          <input name="state" placeholder="State" />
          <input name="followerCount" type="number" min={0} defaultValue={0} />
          <input name="avgEngagement" type="number" min={0} step="0.1" defaultValue={0} />
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

"use client";

import { useEffect, useState } from "react";

type MePayload = {
  data?: {
    instagramConnected?: boolean;
    instagramUsername?: string | null;
  };
};

export default function CreatorSettingsPage() {
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/auth/me");
      const result = (await response.json()) as MePayload;
      if (!response.ok) {
        window.location.assign("/login");
        return;
      }
      setInstagramConnected(Boolean(result.data?.instagramConnected));
      setInstagramUsername(result.data?.instagramUsername ?? null);
    })();
  }, []);

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Account</h1>
        <p className="subtitle">
          Merex uses your Instagram identity. There is no separate email or password to manage for your creator
          account.
        </p>
      </div>
      <div className="card">
        <h2 className="section-title">Instagram</h2>
        <p className="muted m-0">
          {instagramConnected ? (
            <>
              Connected as <strong>@{instagramUsername ?? "user"}</strong>. Profile and stats sync from Instagram when
              you use &quot;Update from Instagram&quot; on your profile.
            </>
          ) : (
            <>Connect Instagram to apply to campaigns and sync your public profile.</>
          )}
        </p>
        {!instagramConnected ? (
          <a className="btn secondary mt-4 inline-flex" href="/api/auth/instagram/start?mode=connect">
            Connect Instagram
          </a>
        ) : (
          <a className="btn secondary mt-4 inline-flex" href="/api/auth/instagram/start?mode=connect">
            Reconnect Instagram
          </a>
        )}
      </div>
    </section>
  );
}

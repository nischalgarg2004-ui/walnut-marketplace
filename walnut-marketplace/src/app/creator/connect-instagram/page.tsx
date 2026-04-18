"use client";

import { useEffect, useState } from "react";

type MeResponse = {
  data?: {
    role?: string;
    instagramConnected?: boolean;
    instagramUsername?: string | null;
  };
};

export default function ConnectInstagramPage() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const body = (await res.json()) as MeResponse;
      setConnected(Boolean(body.data?.instagramConnected));
      setUsername(body.data?.instagramUsername ?? null);
    })();
  }, []);

  return (
    <section className="stack" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="card hero">
        <h1 className="title">Connect Instagram to Unlock Creator Tools</h1>
        <p className="subtitle">
          Discovery, applications, and project workflows are enabled only after connecting a
          Professional Instagram account.
        </p>
      </div>
      <div className="card">
        {connected ? (
          <>
            <p className="help">Connected as @{username ?? "instagram-user"}.</p>
            <a className="btn primary" href="/creator/dashboard">
              Go to Creator Dashboard
            </a>
          </>
        ) : (
          <a className="btn secondary" href="/api/auth/instagram/start?mode=connect">
            Connect Instagram Professional
          </a>
        )}
      </div>
    </section>
  );
}

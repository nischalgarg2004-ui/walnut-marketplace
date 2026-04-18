"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CREATOR_NICHES } from "@/lib/creator-niches";

type ProfileRow = {
  fullName: string;
  bio: string | null;
  gender: string | null;
  niches: string[];
  city: string | null;
  state: string | null;
  instagramHandle: string | null;
  instagramUsername: string | null;
  instagramConnectedAt: string | null;
  followerCount: number;
  postCount: number;
  avgEngagement: number;
  instagramStatsSyncedAt: string | null;
};

export default function CreatorProfilePage() {
  const [message, setMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [avgEngagement, setAvgEngagement] = useState(0);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [instagramStatsSyncedAt, setInstagramStatsSyncedAt] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profiles/creator");
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Could not load profile");
        return;
      }
      const p = result.data as ProfileRow;
      setFullName(p.fullName ?? "");
      setBio(p.bio ?? "");
      setGender(p.gender ?? "");
      setCity(p.city ?? "");
      setState(p.state ?? "");
      setFollowerCount(p.followerCount ?? 0);
      setPostCount(p.postCount ?? 0);
      setAvgEngagement(p.avgEngagement ?? 0);
      setSelectedNiches(Array.isArray(p.niches) ? p.niches : []);
      const connected = Boolean(p.instagramConnectedAt);
      setInstagramConnected(connected);
      setInstagramUsername(p.instagramUsername ?? p.instagramHandle ?? null);
      setInstagramStatsSyncedAt(p.instagramStatsSyncedAt ?? null);
      if (connected && (p.instagramUsername || p.instagramHandle)) {
        const handle = (p.instagramUsername ?? p.instagramHandle ?? "").replace(/^@/, "");
        if (handle && !p.fullName?.trim()) {
          setFullName(handle);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function toggleNiche(slug: string) {
    setSelectedNiches((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 5) {
        setMessage("You can select at most 5 niches.");
        return prev;
      }
      setMessage("");
      return [...prev, slug];
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedNiches.length < 1 || selectedNiches.length > 5) {
      setMessage("Choose between 1 and 5 niches.");
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      bio: bio.trim() || undefined,
      gender: gender.trim() || undefined,
      niches: selectedNiches,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      followerCount,
      postCount,
      avgEngagement
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
    if (response.ok) {
      void loadProfile();
    }
  }

  async function onSyncInstagram() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/profiles/creator/sync-instagram", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setSyncMessage(result.error ?? "Sync failed");
        return;
      }
      const p = result.data as ProfileRow;
      setFullName(p.fullName ?? fullName);
      setFollowerCount(p.followerCount ?? 0);
      setPostCount(p.postCount ?? 0);
      setInstagramStatsSyncedAt(p.instagramStatsSyncedAt ?? null);
      setSyncMessage("Instagram stats updated.");
      void loadProfile();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Creator Profile</h1>
        <p className="subtitle">
          Quality signals for brands: your niches, location, and Instagram metrics. Connect Instagram so your handle
          and display name stay aligned with your Professional account.
        </p>
      </div>
      <div className="card">
        {loading ? (
          <p className="help">Loading profile…</p>
        ) : (
          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-full">
              <label className="block text-sm font-medium text-foreground">Full name</label>
              <input
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name (from Instagram when connected)"
                required
              />
              {instagramConnected && instagramUsername ? (
                <p className="help m-0 mt-1">
                  Instagram: @{instagramUsername.replace(/^@/, "")} — saved as your public handle.
                </p>
              ) : null}
            </div>

            <div className="form-full">
              <label className="block text-sm font-medium text-foreground">Niches (1–5)</label>
              <p className="help m-0 mb-2">Pick the categories that best describe your content for Indian audiences.</p>
              <div
                className="max-h-64 overflow-y-auto rounded-md border border-input bg-muted/30 p-3"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}
              >
                {CREATOR_NICHES.map(({ slug, label }) => (
                  <label key={slug} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedNiches.includes(slug)}
                      onChange={() => toggleNiche(slug)}
                      className="mt-1 w-auto"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="help m-0 mt-1">Selected: {selectedNiches.length} / 5</p>
            </div>

            <div className="form-full">
              <label className="block text-sm font-medium text-foreground">Short bio</label>
              <textarea
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short creator bio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Gender</label>
              <input name="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">City</label>
              <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">State</label>
              <input name="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Follower count</label>
              <input
                name="followerCount"
                type="number"
                min={0}
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                disabled={instagramConnected}
                title={instagramConnected ? "Use “Update from Instagram” to refresh from your account" : undefined}
              />
              {instagramConnected ? (
                <p className="help m-0 mt-1">Synced from Instagram when you use the update action below.</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Post count (media)</label>
              <input
                name="postCount"
                type="number"
                min={0}
                value={postCount}
                onChange={(e) => setPostCount(Number(e.target.value))}
                disabled={instagramConnected}
                title={instagramConnected ? "Use “Update from Instagram” to refresh from your account" : undefined}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Average engagement rate (%)</label>
              <input
                name="avgEngagement"
                type="number"
                min={0}
                step="0.1"
                value={avgEngagement}
                onChange={(e) => setAvgEngagement(Number(e.target.value))}
              />
            </div>

            {instagramConnected ? (
              <div className="form-full flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn secondary"
                  disabled={syncing}
                  onClick={() => void onSyncInstagram()}
                >
                  {syncing ? "Updating…" : "Update from Instagram"}
                </button>
                <p className="help m-0">
                  Pulls display name, followers, and media count from Instagram Graph using your connected account (not
                  public-page scraping).
                </p>
                {instagramStatsSyncedAt ? (
                  <p className="help m-0">
                    Last synced: {new Date(instagramStatsSyncedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            ) : null}

            {syncMessage ? <p className="form-full help text-emerald-800">{syncMessage}</p> : null}

            <div className="form-full">
              <button className="btn primary" type="submit">
                Save profile
              </button>
            </div>
          </form>
        )}
        <p className="help">{message}</p>
      </div>
    </section>
  );
}

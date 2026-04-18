"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  instagramProfilePictureUrl: string | null;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

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
  const [nicheAddValue, setNicheAddValue] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [instagramStatsSyncedAt, setInstagramStatsSyncedAt] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const displayHandle = useMemo(() => {
    const h = instagramUsername ?? "";
    return h.replace(/^@/, "");
  }, [instagramUsername]);

  const initials = useMemo(() => initialsFromName(fullName || displayHandle || "Creator"), [fullName, displayHandle]);

  const nicheLabel = useCallback((slug: string) => CREATOR_NICHES.find((n) => n.slug === slug)?.label ?? slug, []);

  const availableNicheOptions = useMemo(
    () => CREATOR_NICHES.filter((n) => !selectedNiches.includes(n.slug)),
    [selectedNiches]
  );

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
      setProfilePictureUrl(p.instagramProfilePictureUrl ?? null);
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

  function removeNiche(slug: string) {
    setSelectedNiches((prev) => prev.filter((s) => s !== slug));
    setMessage("");
  }

  function onNicheSelect(value: string) {
    if (!value) return;
    if (selectedNiches.includes(value)) {
      setNicheAddValue("");
      return;
    }
    if (selectedNiches.length >= 5) {
      setMessage("You can select at most 5 niches.");
      return;
    }
    setSelectedNiches((prev) => [...prev, value]);
    setNicheAddValue("");
    setMessage("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedNiches.length < 1 || selectedNiches.length > 5) {
      setMessage("Choose between 1 and 5 niches using the dropdown, then save.");
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
    setMessage(response.ok ? `Profile saved for ${result.data.fullName}.` : `Failed: ${result.error}`);
    if (response.ok) {
      void loadProfile();
    }
  }

  async function onSyncFromInstagram() {
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
      setProfilePictureUrl(p.instagramProfilePictureUrl ?? null);
      setSyncMessage("Synced from your public Instagram profile.");
      void loadProfile();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="stack max-w-3xl">
      <div className="card hero">
        <h1 className="title">Creator profile</h1>
        <p className="subtitle">
          This is how brands see you: photo, handle, niches, and location. Connect Instagram to keep your handle in sync;
          use <strong>Update from Instagram</strong> to refresh name, photo, and public stats from the web profile.
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <p className="help m-0">Loading profile…</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border bg-gradient-to-br from-accent/40 via-card to-card px-6 py-8 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <div
                  className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-card shadow-md ring-2 ring-border sm:mx-0"
                  aria-hidden
                >
                  {profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Instagram CDN URLs
                    <img
                      src={profilePictureUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold tracking-tight text-muted-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Public preview</p>
                  <h2 className="title mt-1 text-2xl">{fullName.trim() || "Your name"}</h2>
                  {displayHandle ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      @{displayHandle}
                      {instagramConnected ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                          Instagram linked
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Add Instagram in settings to show a handle.</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
                    <div>
                      <span className="text-lg font-semibold tabular-nums text-foreground">
                        {formatCompact(followerCount)}
                      </span>
                      <span className="ml-1.5 text-sm text-muted-foreground">followers</span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold tabular-nums text-foreground">
                        {formatCompact(postCount)}
                      </span>
                      <span className="ml-1.5 text-sm text-muted-foreground">posts</span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold tabular-nums text-foreground">{avgEngagement}%</span>
                      <span className="ml-1.5 text-sm text-muted-foreground">avg. engagement</span>
                    </div>
                  </div>
                  {instagramConnected && displayHandle ? (
                    <div className="mt-5 flex flex-col items-center gap-2 sm:items-start">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={syncing}
                        onClick={() => void onSyncFromInstagram()}
                      >
                        {syncing ? "Updating…" : "Update from Instagram"}
                      </button>
                      <p className="help m-0 max-w-md text-left">
                        Loads your display name, profile photo, and public follower/post counts from instagram.com (same
                        as a logged-out visitor). Private or restricted accounts may not sync.
                      </p>
                      {instagramStatsSyncedAt ? (
                        <p className="help m-0">Last updated: {new Date(instagramStatsSyncedAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="form-grid p-6 sm:p-8" aria-labelledby="profile-details-heading">
              <h3 id="profile-details-heading" className="form-full m-0 text-lg font-semibold text-foreground">
                Details
              </h3>

              <div className="form-full">
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name shown to brands"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-full">
                <label className="mb-1 block text-sm font-medium text-foreground" id="niches-label">
                  Niches (1–5)
                </label>
                <p className="help m-0 mb-2" id="niches-hint">
                  Choose from the list, add up to five, then save. Brands use this for matching campaigns.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    className="max-w-md"
                    aria-labelledby="niches-label"
                    aria-describedby="niches-hint"
                    value={nicheAddValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNicheAddValue(v);
                      onNicheSelect(v);
                    }}
                    disabled={availableNicheOptions.length === 0 || selectedNiches.length >= 5}
                  >
                    <option value="">
                      {selectedNiches.length >= 5 ? "Maximum niches selected" : "Add a niche…"}
                    </option>
                    {availableNicheOptions.map(({ slug, label }) => (
                      <option key={slug} value={slug}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedNiches.length > 0 ? (
                  <ul className="mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Selected niches">
                    {selectedNiches.map((slug) => (
                      <li key={slug}>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                          onClick={() => removeNiche(slug)}
                        >
                          {nicheLabel(slug)}
                          <span className="text-muted-foreground" aria-hidden>
                            ×
                          </span>
                          <span className="sr-only">Remove {nicheLabel(slug)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="help m-0 mt-2">No niches yet — pick at least one from the dropdown.</p>
                )}
                <p className="help m-0 mt-1">{selectedNiches.length} of 5 selected</p>
              </div>

              <div className="form-full">
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bio">
                  Short bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What do you create? Tone, languages, audience."
                  rows={4}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="gender">
                  Gender
                </label>
                <input
                  id="gender"
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Optional"
                  autoComplete="sex"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="city">
                  City
                </label>
                <input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State / UT"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="followerCount">
                  Follower count
                </label>
                <input
                  id="followerCount"
                  name="followerCount"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(Number(e.target.value))}
                  disabled={instagramConnected}
                  aria-describedby="followers-help"
                />
                <p id="followers-help" className="help m-0 mt-1">
                  {instagramConnected
                    ? "Synced from Instagram when you use Update from Instagram."
                    : "Enter manually if Instagram is not connected."}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="postCount">
                  Post count (media)
                </label>
                <input
                  id="postCount"
                  name="postCount"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={postCount}
                  onChange={(e) => setPostCount(Number(e.target.value))}
                  disabled={instagramConnected}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="avgEngagement">
                  Average engagement rate (%)
                </label>
                <input
                  id="avgEngagement"
                  name="avgEngagement"
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  value={avgEngagement}
                  onChange={(e) => setAvgEngagement(Number(e.target.value))}
                  aria-describedby="engagement-help"
                />
                <p id="engagement-help" className="help m-0 mt-1">
                  Approximate average engagement on your posts (you can estimate).
                </p>
              </div>

              {syncMessage ? (
                <p
                  className={`form-full m-0 text-sm ${syncMessage.includes("failed") || syncMessage.includes("Could not") ? "text-destructive" : "text-emerald-800"}`}
                  role="status"
                >
                  {syncMessage}
                </p>
              ) : null}

              <div className="form-full flex flex-wrap items-center gap-3 pt-2">
                <button className="btn primary" type="submit">
                  Save profile
                </button>
                <p className="help m-0">Saves bio, location, niches, and engagement. Instagram metrics stay in sync when you use the button above.</p>
              </div>
            </form>
          </>
        )}
        {message ? (
          <p className="border-t border-border px-6 py-3 text-sm text-foreground sm:px-8" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

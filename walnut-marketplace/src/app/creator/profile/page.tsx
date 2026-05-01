"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CREATOR_NICHES } from "@/lib/creator-niches";
import { getAllDistrictsFlat, getDistrictsForState, INDIA_STATES } from "@/lib/india-geography";

type ProfileRow = {
  fullName: string;
  bio: string | null;
  gender: string | null;
  niches: string[];
  city: string | null;
  state: string | null;
  indiaStateId: string | null;
  indiaDistrictId: string | null;
  instagramHandle: string | null;
  instagramUsername: string | null;
  instagramConnectedAt: string | null;
  followerCount: number;
  postCount: number;
  instagramViewsTotal?: number;
  instagramStatsSyncedAt: string | null;
  instagramProfilePictureUrl: string | null;
  primaryPersona?: "CREATOR" | "EDITOR_PAGE" | null;
  clippingEnabled?: boolean;
  editorPageHandle?: string | null;
  clippingCapabilities?: string[];
};

type CreatorInsightsRow = {
  name: string;
  period?: string;
  values?: Array<{ value?: number }>;
  title?: string;
  description?: string;
};

type CreatorInsightsResponse = {
  data?: {
    account: {
      instagramUserId: string;
      username: string;
      accountType: string;
      followerCount: number;
      postCount: number;
    };
    latestMedia: Array<{ id: string; permalink?: string; mediaType?: string; timestamp?: string }>;
    selectedMediaId: string | null;
    selectedMediaPermalink: string | null;
    selectedMediaType: string | null;
    insights: CreatorInsightsRow[];
    diagnostics: {
      requestedMetrics: string[];
      returnedMetrics: string[];
      unsupportedMetrics: string[];
      classification: string;
      status: "COMPLETE" | "PARTIAL" | "NO_DATA" | "ERROR";
      errorMessage?: string;
    };
    tokenRefreshed: boolean;
    fetchedAt: string;
  };
  error?: string;
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

/** Stored slug: male | female | other */
function normalizeGender(g: string | null | undefined): string {
  if (!g) return "";
  const x = g.toLowerCase().trim();
  if (x === "male" || x === "female" || x === "other") return x;
  return "";
}

function formatGenderLabel(slug: string): string {
  if (slug === "male") return "Male";
  if (slug === "female") return "Female";
  if (slug === "other") return "Other";
  return "—";
}

function stateLabelById(id: string | null | undefined): string {
  if (!id) return "";
  return INDIA_STATES.find((s) => s.id === id)?.name ?? "";
}

const districtFlat = getAllDistrictsFlat();
function districtLabelById(id: string | null | undefined): string {
  if (!id) return "";
  return districtFlat.find((d) => d.id === id)?.name ?? "";
}

export default function CreatorProfilePage() {
  const [message, setMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [indiaStateId, setIndiaStateId] = useState("");
  const [indiaDistrictId, setIndiaDistrictId] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [instagramViewsTotal, setInstagramViewsTotal] = useState(0);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [primaryPersona, setPrimaryPersona] = useState<"CREATOR" | "EDITOR_PAGE">("CREATOR");
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [editorPageHandle, setEditorPageHandle] = useState("");
  const [clippingCapabilities, setClippingCapabilities] = useState("");
  const [nicheAddValue, setNicheAddValue] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [instagramStatsSyncedAt, setInstagramStatsSyncedAt] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [insights, setInsights] = useState<CreatorInsightsResponse["data"] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsMessage, setInsightsMessage] = useState("");
  const [selectedInsightsMediaId, setSelectedInsightsMediaId] = useState<string>("");

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
      setGender(normalizeGender(p.gender));
      setCity(p.city ?? "");
      setState(p.state ?? "");
      setIndiaStateId(p.indiaStateId ?? "");
      setIndiaDistrictId(p.indiaDistrictId ?? "");
      setFollowerCount(p.followerCount ?? 0);
      setPostCount(p.postCount ?? 0);
      setInstagramViewsTotal(p.instagramViewsTotal ?? 0);
      setSelectedNiches(Array.isArray(p.niches) ? p.niches : []);
      setPrimaryPersona(p.primaryPersona === "EDITOR_PAGE" ? "EDITOR_PAGE" : "CREATOR");
      setClippingEnabled(Boolean(p.clippingEnabled));
      setEditorPageHandle(p.editorPageHandle ?? "");
      setClippingCapabilities(Array.isArray(p.clippingCapabilities) ? p.clippingCapabilities.join(", ") : "");
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

  useEffect(() => {
    void loadInsights();
  }, []);

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

  function cancelEdit() {
    setEditing(false);
    setMessage("");
    void loadProfile();
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
      niches: selectedNiches,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      indiaStateId: indiaStateId || null,
      indiaDistrictId: indiaDistrictId || null,
      followerCount,
      postCount,
      gender: gender === "" ? null : (gender as "male" | "female" | "other"),
      primaryPersona,
      clippingEnabled,
      editorPageHandle: editorPageHandle.trim() || undefined,
      clippingCapabilities: clippingCapabilities
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    };

    const response = await fetch("/api/profiles/creator", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(`Profile saved for ${result.data.fullName}.`);
      setEditing(false);
      void loadProfile();
    } else {
      setMessage(`Failed: ${result.error}`);
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
      setInstagramViewsTotal(p.instagramViewsTotal ?? 0);
      setInstagramStatsSyncedAt(p.instagramStatsSyncedAt ?? null);
      setProfilePictureUrl(p.instagramProfilePictureUrl ?? null);
      setSyncMessage("Synced from your public Instagram profile.");
      void loadProfile();
    } finally {
      setSyncing(false);
    }
  }

  async function loadInsights(showRefreshMessage = false, mediaId?: string) {
    setInsightsLoading(true);
    if (showRefreshMessage) setInsightsMessage("");
    try {
      const url = new URL("/api/creator/insights", window.location.origin);
      const selected = mediaId ?? selectedInsightsMediaId;
      if (selected) url.searchParams.set("mediaId", selected);
      const response = await fetch(url.toString());
      const result = (await response.json()) as CreatorInsightsResponse;
      if (!response.ok || !result.data) {
        setInsights(null);
        setInsightsMessage(result.error ?? "Could not fetch insights");
        return;
      }
      setInsights(result.data);
      setSelectedInsightsMediaId(result.data.selectedMediaId ?? "");
      setInsightsMessage(showRefreshMessage ? "Insights refreshed from Instagram Graph." : "");
    } finally {
      setInsightsLoading(false);
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      Connect Instagram to show a handle on your public preview.
                    </p>
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
                    {instagramViewsTotal > 0 ? (
                      <div>
                        <span className="text-lg font-semibold tabular-nums text-foreground">
                          {formatCompact(instagramViewsTotal)}
                        </span>
                        <span className="ml-1.5 text-sm text-muted-foreground">views</span>
                      </div>
                    ) : null}
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
                        Uses your Instagram login (official API) when connected, and fills in any gaps from the public
                        web profile. If sync fails, try{" "}
                        <a href="/creator/connect-instagram" className="underline underline-offset-2">
                          reconnecting Instagram
                        </a>
                        .
                      </p>
                      {instagramStatsSyncedAt ? (
                        <p className="help m-0">Last updated: {new Date(instagramStatsSyncedAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {!editing ? (
              <div className="px-6 py-8 sm:px-8" aria-labelledby="profile-details-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 id="profile-details-heading" className="m-0 text-lg font-semibold text-foreground">
                    Details
                  </h3>
                  <button type="button" className="btn primary shrink-0" onClick={() => setEditing(true)}>
                    Edit profile
                  </button>
                </div>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full name</dt>
                    <dd className="mt-1 text-foreground">{fullName.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gender</dt>
                    <dd className="mt-1 text-foreground">{gender ? formatGenderLabel(gender) : "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-foreground">{bio.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">City</dt>
                    <dd className="mt-1 text-foreground">{city.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">State</dt>
                    <dd className="mt-1 text-foreground">{state.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      India (state / UT)
                    </dt>
                    <dd className="mt-1 text-foreground">{stateLabelById(indiaStateId) || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">District</dt>
                    <dd className="mt-1 text-foreground">{districtLabelById(indiaDistrictId) || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary persona</dt>
                    <dd className="mt-1 text-foreground">{primaryPersona === "EDITOR_PAGE" ? "Editor/Page" : "Creator"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Follower count</dt>
                    <dd className="mt-1 tabular-nums text-foreground">{followerCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Post count</dt>
                    <dd className="mt-1 tabular-nums text-foreground">{postCount.toLocaleString()}</dd>
                  </div>
                  {instagramViewsTotal > 0 ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Views</dt>
                      <dd className="mt-1 tabular-nums text-foreground">{instagramViewsTotal.toLocaleString()}</dd>
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Niches</dt>
                    <dd className="mt-2">
                      {selectedNiches.length > 0 ? (
                        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                          {selectedNiches.map((slug) => (
                            <li
                              key={slug}
                              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-foreground"
                            >
                              {nicheLabel(slug)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>
                </dl>
                {syncMessage ? (
                  <p
                    className={`mt-6 text-sm ${syncMessage.includes("failed") || syncMessage.includes("Could not") ? "text-destructive" : "text-emerald-800"}`}
                    role="status"
                  >
                    {syncMessage}
                  </p>
                ) : null}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="form-grid p-6 sm:p-8" aria-labelledby="profile-edit-heading">
                <div className="form-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 id="profile-edit-heading" className="m-0 text-lg font-semibold text-foreground">
                    Edit details
                  </h3>
                  <button type="button" className="btn ghost shrink-0" onClick={() => cancelEdit()}>
                    Cancel
                  </button>
                </div>

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
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    autoComplete="sex"
                  >
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-full rounded-lg border border-border bg-muted/30 p-4">
                  <p className="m-0 mb-3 text-sm font-medium text-foreground">Home region (India)</p>
                  <p className="help m-0 mb-3">
                    Optional. Used to match barter campaigns that target specific districts. Leave empty if you prefer.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="indiaStateId">
                        State / UT
                      </label>
                      <select
                        id="indiaStateId"
                        value={indiaStateId}
                        onChange={(e) => {
                          setIndiaStateId(e.target.value);
                          setIndiaDistrictId("");
                        }}
                      >
                        <option value="">Not specified</option>
                        {INDIA_STATES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="indiaDistrictId">
                        District
                      </label>
                      <select
                        id="indiaDistrictId"
                        value={indiaDistrictId}
                        disabled={!indiaStateId}
                        onChange={(e) => setIndiaDistrictId(e.target.value)}
                      >
                        <option value="">{indiaStateId ? "Select district…" : "Choose a state first"}</option>
                        {getDistrictsForState(indiaStateId).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  <label className="mb-1 block text-sm font-medium text-foreground">Primary profile type</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="radio"
                        checked={primaryPersona === "CREATOR"}
                        onChange={() => setPrimaryPersona("CREATOR")}
                      />
                      <span>Creator (UGC)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <input
                        type="radio"
                        checked={primaryPersona === "EDITOR_PAGE"}
                        onChange={() => setPrimaryPersona("EDITOR_PAGE")}
                      />
                      <span>Editor/Page (Clipping)</span>
                    </label>
                  </div>
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

                <div className="form-full rounded-lg border border-border bg-muted/30 p-4">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={clippingEnabled}
                      onChange={(e) => setClippingEnabled(e.target.checked)}
                    />
                    Enable clipping opportunities
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={editorPageHandle}
                      onChange={(e) => setEditorPageHandle(e.target.value)}
                      placeholder="Editor/Page handle (optional)"
                    />
                    <input
                      value={clippingCapabilities}
                      onChange={(e) => setClippingCapabilities(e.target.value)}
                      placeholder="Capabilities (comma separated)"
                    />
                  </div>
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
                  <p className="help m-0">Saves your details. Instagram follower/post counts stay in sync when you use Update from Instagram above.</p>
                </div>
              </form>
            )}
          </>
        )}
        {message ? (
          <p className="border-t border-border px-6 py-3 text-sm text-foreground sm:px-8" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title m-0">Instagram insights</h2>
          <button
            type="button"
            className="btn secondary"
            disabled={insightsLoading}
            onClick={() => void loadInsights(true)}
          >
            {insightsLoading ? "Refreshing…" : "Refresh insights"}
          </button>
        </div>
        <p className="help m-0 mt-1">
          Live Graph insights from your connected account. This is the primary production testing surface for creators.
        </p>
        {!insights ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {insightsLoading ? "Loading insights…" : insightsMessage || "Insights unavailable. Connect Instagram and try again."}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border p-3">
              <p className="m-0 text-sm font-medium text-foreground">
                @{insights.account.username} · {insights.account.accountType}
              </p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                Followers: {insights.account.followerCount.toLocaleString()} · Posts: {insights.account.postCount.toLocaleString()}
              </p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                Last fetched: {new Date(insights.fetchedAt).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="m-0 text-sm font-medium text-foreground">Insights status</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{insights.diagnostics.status}</span> ·{" "}
                {insights.diagnostics.classification}
              </p>
              {insights.diagnostics.errorMessage ? (
                <p className="m-0 mt-1 text-xs text-destructive">{insights.diagnostics.errorMessage}</p>
              ) : null}
              {insights.diagnostics.unsupportedMetrics.length > 0 ? (
                <p className="m-0 mt-1 text-xs text-muted-foreground">
                  Unsupported for selected media: {insights.diagnostics.unsupportedMetrics.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-border p-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="insightsMediaId">
                Selected media for insights
              </label>
              <select
                id="insightsMediaId"
                value={selectedInsightsMediaId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedInsightsMediaId(next);
                  void loadInsights(true, next);
                }}
              >
                {insights.latestMedia.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mediaType ?? "MEDIA"} · {m.id.slice(0, 12)}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-h-56 overflow-auto rounded-lg border border-border p-3">
              <p className="m-0 text-sm font-medium text-foreground">Latest media</p>
              {insights.latestMedia.length === 0 ? (
                <p className="m-0 mt-2 text-xs text-muted-foreground">No media found for this account.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {insights.latestMedia.map((m) => (
                    <li key={m.id}>
                      {m.mediaType ?? "MEDIA"} · {m.id}
                      {m.permalink ? (
                        <>
                          {" "}
                          ·{" "}
                          <a href={m.permalink} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            open
                          </a>
                        </>
                      ) : null}
                      {m.timestamp ? <> · {new Date(m.timestamp).toLocaleString()}</> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-border p-3">
              <p className="m-0 text-sm font-medium text-foreground">Selected media insights</p>
              {insights.insights.length === 0 ? (
                <p className="m-0 mt-2 text-xs text-muted-foreground">No insights returned for the selected media.</p>
              ) : (
                <table className="mt-2 w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="py-1 pr-2">Metric</th>
                      <th className="py-1 pr-2">Value</th>
                      <th className="py-1">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.insights.map((row) => (
                      <tr key={row.name} className="border-t border-border/60">
                        <td className="py-1 pr-2 text-foreground">{row.name}</td>
                        <td className="py-1 pr-2 text-foreground">
                          {typeof row.values?.[0]?.value === "number" ? row.values[0]!.value!.toLocaleString() : "—"}
                        </td>
                        <td className="py-1 text-muted-foreground">{row.period ?? "lifetime"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {insightsMessage ? (
          <p className={`mt-3 text-sm ${insightsMessage.includes("Could not") ? "text-destructive" : "text-emerald-800"}`}>
            {insightsMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

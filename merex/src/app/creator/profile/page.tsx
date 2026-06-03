"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreatorInstagramInsightsCard from "@/components/creator/CreatorInstagramInsightsCard";
import { CREATOR_NICHES } from "@/lib/creator-niches";
import { getAllDistrictsFlat, getDistrictsForState, INDIA_STATES } from "@/lib/india-geography";

type ProfileRow = {
  fullName: string;
  bio: string | null;
  gender: string | null;
  niches: string[];
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

type SyncMeta = {
  syncStatus?: "fresh" | "degraded" | "failed";
  syncReason?: string | null;
  reconnectRecommended?: boolean;
  syncMessage?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function normalizeDisplayInstagramHandle(value: string | null | undefined): string | null {
  const normalized = (value ?? "").replace(/^@/, "").trim();
  if (!normalized) return null;
  if (/^instagram_\d+$/i.test(normalized)) return null;
  return normalized;
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

function indiaStateLabelById(id: string | null | undefined): string {
  if (!id) return "";
  return INDIA_STATES.find((s) => s.id === id)?.name ?? "";
}

const districtFlat = getAllDistrictsFlat();
function districtLabelById(id: string | null | undefined): string {
  if (!id) return "";
  return districtFlat.find((d) => d.id === id)?.name ?? "";
}

export default function CreatorProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardingMode = searchParams.get("onboarding") === "1";
  const [message, setMessage] = useState("");
  const [syncNotice, setSyncNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
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

  const displayHandle = useMemo(() => {
    const h = instagramUsername ?? "";
    return h.replace(/^@/, "");
  }, [instagramUsername]);

  const initials = useMemo(() => initialsFromName(fullName || displayHandle || "Creator"), [fullName, displayHandle]);
  const primaryIdentityLabel = useMemo(
    () => (displayHandle ? `@${displayHandle}` : "Instagram username unavailable"),
    [displayHandle]
  );
  const instagramProfileUrl = useMemo(
    () => (displayHandle ? `https://www.instagram.com/${encodeURIComponent(displayHandle)}/` : null),
    [displayHandle]
  );

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
      const resolvedHandle = normalizeDisplayInstagramHandle(p.instagramUsername ?? p.instagramHandle ?? null);
      setInstagramUsername(resolvedHandle);
      setInstagramStatsSyncedAt(p.instagramStatsSyncedAt ?? null);
      setProfilePictureUrl(p.instagramProfilePictureUrl ?? null);
      if (connected && resolvedHandle) {
        const handle = resolvedHandle;
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
    if (!onboardingMode) return;
    setEditing(false);
    setMessage("Instagram connected. Review your profile, then click Edit profile to complete missing details.");
  }, [onboardingMode]);

  function removeNiche(slug: string) {
    setSelectedNiches((prev) => prev.filter((s) => s !== slug));
    setMessage("");
  }

  function getSyncCopyFromError(errorText: string): { kind: "error" | "info"; text: string } {
    const lower = errorText.toLowerCase();
    if (lower.includes("authorization is no longer valid") || lower.includes("token_lifecycle_broken")) {
      return {
        kind: "error",
        text: "Instagram authorization is no longer valid. Please reconnect Instagram, then try Update again."
      };
    }
    if (lower.includes("token") || lower.includes("code=190") || lower.includes("code=10") || lower.includes("code=200")) {
      return {
        kind: "error",
        text: "Instagram authorization needs attention. Reconnect Instagram and try again."
      };
    }
    if (lower.includes("private") || lower.includes("restricted") || lower.includes("blocked")) {
      return {
        kind: "info",
        text: "Instagram blocked live fetch for now. We are showing your saved profile values."
      };
    }
    return {
      kind: "error",
      text: "Could not sync from Instagram right now. Please try again in a bit."
    };
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
      if (onboardingMode) {
        router.replace("/creator");
      }
    } else {
      setMessage(`Failed: ${result.error}`);
    }
  }

  async function onSyncFromInstagram() {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const response = await fetch("/api/profiles/creator/sync-instagram", { method: "POST" });
      const result = await response.json();
      const meta = (result.meta ?? {}) as SyncMeta;
      if (!response.ok) {
        if (response.status === 409 || meta.syncReason === "token_lifecycle_broken" || meta.reconnectRecommended) {
          setSyncNotice({
            kind: "error",
            text: meta.syncMessage ?? "Instagram authorization is no longer valid. Please reconnect Instagram, then try Update again."
          });
          return;
        }
        setSyncNotice(getSyncCopyFromError(result.error ?? "Sync failed"));
        return;
      }
      const p = result.data as ProfileRow;
      setFullName(p.fullName ?? fullName);
      setFollowerCount(p.followerCount ?? 0);
      setPostCount(p.postCount ?? 0);
      setInstagramViewsTotal(p.instagramViewsTotal ?? 0);
      setInstagramStatsSyncedAt(p.instagramStatsSyncedAt ?? null);
      setProfilePictureUrl(p.instagramProfilePictureUrl ?? null);
      if (meta.syncStatus === "degraded") {
        setSyncNotice({
          kind: "info",
          text: meta.reconnectRecommended
            ? "Instagram data is unavailable right now. Please reconnect Instagram, then try Update again."
            : meta.syncMessage ?? "Showing your saved profile values while Instagram is unavailable."
        });
      } else {
        setSyncNotice({
          kind: "success",
          text: meta.syncMessage ?? "Profile updated from Instagram."
        });
      }
      void loadProfile();
    } catch {
      setSyncNotice({
        kind: "error",
        text: "Network error while syncing from Instagram. Please try again."
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="stack max-w-3xl">
      <div className="card hero">
        <h1 className="title">{onboardingMode ? "Complete your creator profile" : "Creator profile"}</h1>
        <p className="subtitle">
          {onboardingMode
            ? "Instagram is connected. Add your missing details to enter the creator platform."
            : "This is how brands see you: photo, handle, niches, and location. Connect Instagram to keep your handle in sync; use Update from Instagram to refresh name, photo, and public stats from the web profile."}
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
                {instagramProfileUrl ? (
                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-card shadow-md ring-2 ring-border transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mx-0"
                    aria-label={`Open @${displayHandle} on Instagram`}
                    title={`Open @${displayHandle} on Instagram`}
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
                  </a>
                ) : (
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
                )}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Public preview</p>
                  <h2 className="title mt-1 text-2xl">{primaryIdentityLabel}</h2>
                  {displayHandle ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fullName.trim() || "Instagram creator"}
                      {instagramConnected ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                          Instagram linked
                        </span>
                      ) : null}
                    </p>
                  ) : instagramConnected ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Could not fetch your Instagram username yet. Reconnect Instagram and try Update again.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Connect Instagram to show handle and live profile details.</p>
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
                  {instagramConnected ? (
                    <div className="mt-5 flex flex-col items-center gap-2 sm:items-start">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={syncing}
                        onClick={() => void onSyncFromInstagram()}
                        title="Calls Instagram Graph /me to refresh handle, photo, follower and post counts (uses instagram_business_basic)."
                        aria-describedby="ig-update-help"
                      >
                        {syncing ? "Updating…" : "Update from Instagram"}
                      </button>
                      <p id="ig-update-help" className="help m-0 max-w-md text-left">
                        Calls Instagram Graph <code>GET /me</code> on <code>graph.instagram.com</code> to refresh
                        handle, photo, follower and post counts. Uses the
                        {" "}
                        <code>instagram_business_basic</code> permission you granted at sign-in. If sync fails,
                        try{" "}
                        <a href="/creator/connect-instagram" className="underline underline-offset-2">
                          reconnecting Instagram
                        </a>
                        .
                      </p>
                      {instagramStatsSyncedAt ? (
                        <p className="help m-0">Last updated: {new Date(instagramStatsSyncedAt).toLocaleString()}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-col items-center gap-2 sm:items-start">
                      <a href="/creator/connect-instagram" className="btn secondary">
                        Connect Instagram
                      </a>
                      <p className="help m-0 max-w-md text-left">
                        Connect your creator account to auto-fill your handle, photo, and audience stats.
                      </p>
                    </div>
                  )}
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
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">State / UT</dt>
                    <dd className="mt-1 text-foreground">{indiaStateLabelById(indiaStateId) || "—"}</dd>
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
                {syncNotice ? (
                  <p
                    className={`mt-6 text-sm ${syncNotice.kind === "error" ? "text-destructive" : syncNotice.kind === "success" ? "text-emerald-800" : "text-foreground"}`}
                    role="status"
                  >
                    {syncNotice.text}
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

                {syncNotice ? (
                  <p
                    className={`form-full m-0 text-sm ${syncNotice.kind === "error" ? "text-destructive" : syncNotice.kind === "success" ? "text-emerald-800" : "text-foreground"}`}
                    role="status"
                  >
                    {syncNotice.text}
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

      {instagramConnected ? <CreatorInstagramInsightsCard /> : null}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CREATOR_NICHES } from "@/lib/creator-niches";
import { getAllDistrictsFlat, INDIA_STATES } from "@/lib/india-geography";

type SlotKind = "REEL" | "STORY" | "POST";
type SlotRow = { kind: SlotKind; note: string };
type CampaignCategory = "UGC" | "CLIPPING";
type ClippingSourceType =
  | "YOUTUBE_VIDEO"
  | "YOUTUBE_CHANNEL"
  | "INSTAGRAM_PROFILE"
  | "INSTAGRAM_POST"
  | "GOOGLE_DRIVE_FILE"
  | "GOOGLE_DRIVE_FOLDER"
  | "REFERENCE_LINK";
type ClippingSourceRow = { type: ClippingSourceType; url: string; label: string };

const FORM_ID = "business-requirement-form";

export default function RequirementCampaignComposer() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [brandName, setBrandName] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [category, setCategory] = useState<CampaignCategory>("UGC");
  const [clippingSources, setClippingSources] = useState<ClippingSourceRow[]>([
    { type: "YOUTUBE_VIDEO", url: "", label: "" }
  ]);
  const [gender, setGender] = useState<"any" | "male" | "female">("any");
  const [nicheFilterOn, setNicheFilterOn] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [nichePick, setNichePick] = useState("");
  const [hasBarter, setHasBarter] = useState(false);
  const [barterNotes, setBarterNotes] = useState("");
  const [fixedFee, setFixedFee] = useState("");
  const [cpv, setCpv] = useState("");
  const [minFollowers, setMinFollowers] = useState("0");
  const [minEngagement, setMinEngagement] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState("");
  const [allowedDistrictIds, setAllowedDistrictIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([{ kind: "REEL", note: "" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profiles/business");
      const json = await res.json();
      if (res.ok && json.data?.brandName) setBrandName(json.data.brandName);
    })();
  }, []);

  const allDistricts = useMemo(() => getAllDistrictsFlat(), []);
  const districtOptions = useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return allDistricts.slice(0, 80);
    return allDistricts.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 120);
  }, [allDistricts, districtSearch]);

  const toggleDistrict = useCallback((id: string) => {
    setAllowedDistrictIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 200)
    );
  }, []);

  const addSlot = useCallback((kind: SlotKind) => {
    setSlots((prev) => {
      const counts = { REEL: 0, STORY: 0, POST: 0 };
      for (const s of prev) counts[s.kind]++;
      if (counts[kind] >= 10) return prev;
      return [...prev, { kind, note: "" }];
    });
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const setSlotNote = useCallback((index: number, note: string) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, note } : s)));
  }, []);

  const moveSlot = useCallback((index: number, delta: -1 | 1) => {
    setSlots((prev) => {
      const next = index + delta;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const t = copy[index]!;
      copy[index] = copy[next]!;
      copy[next] = t;
      return copy;
    });
  }, []);

  const slotLabel = useCallback((kind: SlotKind, indexInKind: number) => {
    const label = kind === "REEL" ? "Reel" : kind === "STORY" ? "Story" : "Carousel";
    return `${label} ${indexInKind + 1}`;
  }, []);

  const slotRows = useMemo(() => {
    const kindIndex: Record<SlotKind, number> = { REEL: 0, STORY: 0, POST: 0 };
    return slots.map((s, i) => {
      const idx = kindIndex[s.kind]++;
      return { kind: s.kind, index: i, label: slotLabel(s.kind, idx), note: s.note };
    });
  }, [slots, slotLabel]);

  const validClippingSourceCount = useMemo(
    () => clippingSources.filter((s) => s.url.trim().length > 0).length,
    [clippingSources]
  );

  const previewBrief = useMemo(() => {
    const t = brief.trim();
    if (t.length <= 220) return t;
    return `${t.slice(0, 217)}…`;
  }, [brief]);

  const previewStats = useMemo(() => {
    const c = { REEL: 0, STORY: 0, POST: 0 };
    for (const s of slots) c[s.kind]++;
    const parts: string[] = [];
    if (c.REEL) parts.push(`${c.REEL} reel${c.REEL > 1 ? "s" : ""}`);
    if (c.STORY) parts.push(`${c.STORY} stor${c.STORY > 1 ? "ies" : "y"}`);
    if (c.POST) parts.push(`${c.POST} carousel${c.POST > 1 ? "s" : ""}`);
    return parts.join(" · ") || "Add deliverables";
  }, [slots]);

  const addClippingSource = useCallback(() => {
    setClippingSources((prev) =>
      prev.length >= 20 ? prev : [...prev, { type: "REFERENCE_LINK", url: "", label: "" }]
    );
  }, []);

  const removeClippingSource = useCallback((index: number) => {
    setClippingSources((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }, []);

  const setClippingSourceRow = useCallback(
    (index: number, patch: Partial<ClippingSourceRow>) => {
      setClippingSources((prev) =>
        prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
      );
    },
    []
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("Publishing…");

    const genderAllowed =
      gender === "any" ? [] : gender === "male" ? ["male"] : ["female"];
    const minE = minEngagement.trim() === "" ? undefined : Number(minEngagement);
    const fixedN = fixedFee.trim() === "" ? undefined : Number(fixedFee);
    const cpvN = cpv.trim() === "" ? undefined : Number(cpv);

    const payload = {
      title: title.trim(),
      brief: brief.trim(),
      postText: brief.trim(),
      postImageUrl: postImageUrl.trim() || undefined,
      platforms: ["instagram"],
      contentType: "ugc",
      category,
      clippingMeta:
        category === "CLIPPING"
          ? {
              sourceItems: clippingSources
                .filter((s) => s.url.trim().length > 0)
                .map((s) => ({
                  type: s.type,
                  url: s.url.trim(),
                  ...(s.label.trim() ? { label: s.label.trim() } : {})
                }))
            }
          : undefined,
      deliverableSlots: {
        slots:
          category === "CLIPPING"
            ? [{ kind: "REEL" as const }]
            : slots.map((s) => ({
                kind: s.kind,
                ...(s.note.trim() ? { note: s.note.trim().slice(0, 280) } : {})
              }))
      },
      status: "PUBLISHED",
      eligibility: {
        genderAllowed: category === "CLIPPING" ? [] : genderAllowed,
        minFollowers: category === "CLIPPING" ? 0 : Number(minFollowers) || 0,
        minEngagementRate: category === "CLIPPING" ? undefined : minE,
        allowedLocations: [],
        allowedDistrictIds: hasBarter && category !== "CLIPPING" ? allowedDistrictIds : [],
        niches: category === "CLIPPING" ? [] : nicheFilterOn ? niches : []
      },
      compensation: {
        hasBarter,
        barterNotes: hasBarter ? barterNotes.trim() || undefined : undefined,
        fixedFeeAmount: category === "CLIPPING" ? undefined : fixedN,
        cpvRatePer1000: category === "CLIPPING" ? undefined : cpvN,
        currency: "INR"
      }
    };

    const response = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSubmitting(false);
    if (response.ok && result.data?.id) {
      setMessage(`Published: ${result.data?.title ?? "Campaign"}`);
      router.push(`/business/campaigns?highlight=${encodeURIComponent(result.data.id)}`);
      return;
    }
    setMessage(`Failed: ${result.error}`);
  }

  function toggleNiche(slug: string) {
    setNiches((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= 10 ? prev : [...prev, slug]
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-5 lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start lg:gap-10 xl:gap-12">
        {/* Main column */}
        <div className="min-w-0 pb-28 lg:pb-8">
          <header className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-accent/60 via-card to-card p-5 shadow-sm ring-1 ring-black/[0.04] sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary sm:h-14 sm:w-14 sm:text-xl"
                aria-hidden
              >
                {brandName ? brandName.slice(0, 1).toUpperCase() : "B"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                  New campaign
                </p>
                <h1 className="m-0 mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {brandName || "Your brand"}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Structure your brief, deliverables, and who can apply—creators see a clear, scannable view on any device.
                </p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-block">
                Instagram
              </span>
            </div>
            <div className="mt-4 inline-flex rounded-full border border-border bg-muted/30 p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${category === "UGC" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setCategory("UGC")}
              >
                UGC
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${category === "CLIPPING" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setCategory("CLIPPING")}
              >
                Clipping
              </button>
            </div>
          </header>

          <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-8 sm:gap-10">
            {/* 1 — Brief */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="sec-brief">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="sec-brief" className="m-0 text-lg font-semibold text-foreground">
                    Campaign brief
                  </h2>
                  <p className="mt-1 m-0 text-sm text-muted-foreground">
                    Title and story—this is the first thing creators read.
                  </p>
                  {category === "CLIPPING" ? (
                    <p className="m-0 mt-1 text-xs text-muted-foreground">
                      Include CPV / 1k terms directly inside this brief for clipping campaigns.
                    </p>
                  ) : null}
                </div>
              </div>
              <input
                className="mb-3 border-0 border-b border-border/90 bg-transparent px-0 py-2.5 text-lg font-semibold tracking-tight placeholder:text-muted-foreground focus-visible:ring-0 sm:text-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clear, specific title"
                required
                minLength={5}
                aria-label="Campaign title"
                autoComplete="off"
              />
              <textarea
                className="min-h-[9rem] resize-y border-0 bg-transparent px-0 py-2 text-[15px] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0 sm:min-h-[10rem] sm:text-base"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Tone, hooks, must-haves, brand don&apos;ts, and what good creative looks like."
                required
                minLength={10}
                aria-label="Campaign description"
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground" htmlFor="post-image-url">
                  Post image URL (optional)
                </label>
                <input
                  id="post-image-url"
                  className="mt-1"
                  type="url"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  placeholder="https://.../campaign-image.jpg"
                />
              </div>
              <p className="help m-0 mt-2 text-right text-xs tabular-nums text-muted-foreground">
                {brief.length} characters
              </p>
            </section>

            {/* 2 — Deliverables */}
            {category !== "CLIPPING" ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="sec-deliverables">
              <h2 id="sec-deliverables" className="m-0 text-lg font-semibold text-foreground">
                Deliverable lineup
              </h2>
              <p className="help m-0 mt-1">
                Order matches your shoot/post sequence. Add a short note per slot (angles, CTA, format)—creators see
                these next to each deliverable.
              </p>
              <ul className="mt-4 list-none space-y-3 p-0">
                {slotRows.map((row) => (
                  <li
                    key={`${row.index}-${row.label}`}
                    className="rounded-xl border border-border/80 bg-muted/25 p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                        {row.label}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          className="btn ghost px-2 py-1 text-xs"
                          onClick={() => moveSlot(row.index, -1)}
                          disabled={row.index === 0}
                          aria-label={`Move ${row.label} up`}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="btn ghost px-2 py-1 text-xs"
                          onClick={() => moveSlot(row.index, 1)}
                          disabled={row.index === slots.length - 1}
                          aria-label={`Move ${row.label} down`}
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="btn ghost px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => removeSlot(row.index)}
                          disabled={slots.length <= 1}
                          aria-label={`Remove ${row.label}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor={`note-${row.index}`}>
                      Note for this deliverable
                    </label>
                    <textarea
                      id={`note-${row.index}`}
                      className="mt-1.5 min-h-[4.5rem] text-sm"
                      value={row.note}
                      onChange={(e) => setSlotNote(row.index, e.target.value)}
                      placeholder="e.g. Hook in first 2s, mention product name, soft CTA to link in bio…"
                      maxLength={280}
                      rows={3}
                    />
                    <p className="m-0 mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
                      {row.note.length}/280
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn secondary text-sm" onClick={() => addSlot("REEL")}>
                  + Reel
                </button>
                <button type="button" className="btn secondary text-sm" onClick={() => addSlot("STORY")}>
                  + Story
                </button>
                <button type="button" className="btn secondary text-sm" onClick={() => addSlot("POST")}>
                  + Carousel
                </button>
              </div>
            </section>
            ) : null}

            {category === "CLIPPING" ? (
              <>
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="sec-clipping-source">
                  <h2 id="sec-clipping-source" className="m-0 text-lg font-semibold text-foreground">
                    Source bundle
                  </h2>
                  <p className="help m-0 mt-1">
                    Add the long-form or reference links editors will clip from (YouTube, Instagram, Drive, etc.).
                  </p>
                  <div className="mt-4 space-y-3">
                    {clippingSources.map((row, idx) => (
                      <div key={idx} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
                          <select
                            value={row.type}
                            onChange={(e) =>
                              setClippingSourceRow(idx, {
                                type: e.target.value as ClippingSourceType
                              })
                            }
                          >
                            <option value="YOUTUBE_VIDEO">YouTube video</option>
                            <option value="YOUTUBE_CHANNEL">YouTube channel</option>
                            <option value="INSTAGRAM_PROFILE">Instagram profile</option>
                            <option value="INSTAGRAM_POST">Instagram post/reel</option>
                            <option value="GOOGLE_DRIVE_FILE">Drive file</option>
                            <option value="GOOGLE_DRIVE_FOLDER">Drive folder</option>
                            <option value="REFERENCE_LINK">Reference link</option>
                          </select>
                          <input
                            type="url"
                            value={row.url}
                            onChange={(e) => setClippingSourceRow(idx, { url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            value={row.label}
                            onChange={(e) => setClippingSourceRow(idx, { label: e.target.value })}
                            placeholder="Optional label (episode name, profile context...)"
                          />
                          <button
                            type="button"
                            className="btn ghost px-2 py-1 text-xs"
                            onClick={() => removeClippingSource(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" className="btn secondary text-sm" onClick={addClippingSource}>
                      + Add source
                    </button>
                    <p className="m-0 text-xs text-muted-foreground">
                      {validClippingSourceCount} valid source{validClippingSourceCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </section>

              </>
            ) : null}

            {/* 3 — Creator eligibility */}
            {category !== "CLIPPING" ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="sec-eligibility">
              <h2 id="sec-eligibility" className="m-0 text-lg font-semibold text-foreground">
                Creator eligibility
              </h2>
              <p className="help m-0 mt-1">
                These rules apply to <strong className="font-medium text-foreground">who may apply</strong>—not your
                audience targeting for the post.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground" htmlFor="creator-gender">
                  Creator gender
                </label>
                <p className="help m-0 mt-0.5">Restrict applicants by the gender on their creator profile, or leave open to all.</p>
                <select
                  id="creator-gender"
                  className="mt-2 max-w-md border-border bg-background"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "any" | "male" | "female")}
                >
                  <option value="any">Any creator</option>
                  <option value="male">Male creators only</option>
                  <option value="female">Female creators only</option>
                </select>
              </div>

              <div className="mt-6 border-t border-border/80 pt-6">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/15 p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={nicheFilterOn}
                    onChange={(e) => setNicheFilterOn(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium text-foreground">Filter by creator niche</span>
                    <span className="block text-sm text-muted-foreground">
                      Only creators who selected these niches on their profile can apply. Narrowing can shrink your pool.
                    </span>
                  </span>
                </label>
                {nicheFilterOn ? (
                  <div className="mt-3 flex flex-col gap-2 pl-1">
                    <div className="flex flex-wrap gap-2">
                      {niches.map((slug) => (
                        <button
                          key={slug}
                          type="button"
                          className="rounded-full border border-border bg-muted/60 px-3 py-1 text-sm"
                          onClick={() => toggleNiche(slug)}
                        >
                          {CREATOR_NICHES.find((n) => n.slug === slug)?.label ?? slug} ×
                        </button>
                      ))}
                    </div>
                    <select
                      className="max-w-full sm:max-w-md"
                      value={nichePick}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNichePick("");
                        if (v) toggleNiche(v);
                      }}
                    >
                      <option value="">{niches.length >= 10 ? "Max 10 niches" : "Add niche…"}</option>
                      {CREATOR_NICHES.filter((n) => !niches.includes(n.slug)).map((n) => (
                        <option key={n.slug} value={n.slug}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            </section>
            ) : null}

            {/* 4 — Compensation */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="sec-comp">
              <h2 id="sec-comp" className="m-0 text-lg font-semibold text-foreground">
                Compensation
              </h2>
              <p className="help m-0 mt-1">
                {category === "CLIPPING"
                  ? "For clipping campaigns, CPV / 1k should be written in the brief text. Use barter here if applicable."
                  : "At least one of barter, fixed fee, or CPV is required to publish."}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/20">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={hasBarter}
                    onChange={(e) => {
                      setHasBarter(e.target.checked);
                      if (!e.target.checked) setAllowedDistrictIds([]);
                    }}
                  />
                  <span>
                    <span className="font-medium text-foreground">Barter / product</span>
                    <span className="block text-sm text-muted-foreground">Ship product to creators; add details below.</span>
                  </span>
                </label>
                {hasBarter ? (
                  <textarea
                    className="min-h-24"
                    value={barterNotes}
                    onChange={(e) => setBarterNotes(e.target.value)}
                    placeholder="What you&apos;re sending, timelines, expectations…"
                  />
                ) : null}

                {hasBarter ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
                    <p className="m-0 text-sm font-medium text-foreground">District targeting (optional)</p>
                    <p className="help m-0 mt-1">
                      Limit which profile districts can apply when barter is on. Empty = all districts.
                    </p>
                    <input
                      className="mt-2"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      placeholder="Search districts…"
                    />
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border p-2 text-sm">
                      {districtOptions.map((d) => (
                        <label key={d.id} className="flex cursor-pointer items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={allowedDistrictIds.includes(d.id)}
                            onChange={() => toggleDistrict(d.id)}
                          />
                          <span className="truncate">
                            {d.name}{" "}
                            <span className="text-muted-foreground">
                              ({INDIA_STATES.find((s) => s.id === d.stateId)?.name ?? ""})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="help m-0 mt-2">{allowedDistrictIds.length} districts selected</p>
                  </div>
                ) : null}

                {category !== "CLIPPING" ? (
                  <>
                    <label className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center">
                      <span className="shrink-0 font-medium text-foreground sm:w-28">Fixed (₹)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="max-w-full sm:max-w-[14rem]"
                        value={fixedFee}
                        onChange={(e) => setFixedFee(e.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center">
                      <span className="shrink-0 font-medium text-foreground sm:w-28">CPV / 1k</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="max-w-full sm:max-w-[14rem]"
                        value={cpv}
                        onChange={(e) => setCpv(e.target.value)}
                        placeholder="0"
                      />
                    </label>
                  </>
                ) : null}
              </div>
            </section>

            {/* 5 — Advanced */}
            {category !== "CLIPPING" ? (
            <section className="overflow-hidden rounded-2xl border border-border bg-muted/10" aria-labelledby="sec-advanced">
              <button
                type="button"
                id="sec-advanced"
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground sm:px-6"
                onClick={() => setAdvancedOpen((o) => !o)}
                aria-expanded={advancedOpen}
              >
                Advanced metrics
                <span className="text-muted-foreground" aria-hidden>
                  {advancedOpen ? "−" : "+"}
                </span>
              </button>
              {advancedOpen ? (
                <div className="space-y-4 border-t border-border px-5 pb-5 pt-3 sm:px-6">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="minF">
                      Min followers
                    </label>
                    <input
                      id="minF"
                      type="number"
                      min={0}
                      className="mt-1 max-w-xs"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="minE">
                      Min engagement %
                    </label>
                    <input
                      id="minE"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="mt-1 max-w-xs"
                      value={minEngagement}
                      onChange={(e) => setMinEngagement(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ) : null}
            </section>
            ) : null}

            <div className="hidden lg:block">
              <button className="btn primary w-full justify-center py-3.5 text-base" type="submit" disabled={submitting}>
                {submitting ? "Publishing…" : "Publish campaign"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm text-muted-foreground lg:mt-6" role="status">
            {message}
          </p>
        </div>

        {/* Preview column — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-md ring-1 ring-black/[0.06]">
              <div className="flex items-center gap-3 border-b border-border/80 pb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                  aria-hidden
                >
                  {brandName ? brandName.slice(0, 1).toUpperCase() : "B"}
                </div>
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold">{brandName || "Your brand"}</p>
                  <p className="m-0 text-xs text-muted-foreground">Campaign · Instagram</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="m-0 line-clamp-2 text-base font-semibold leading-snug text-foreground">
                  {title.trim() || "Campaign title"}
                </p>
                <p className="mt-2 m-0 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {previewBrief || "Your description will appear here so you can sanity-check length and tone."}
                </p>
                {postImageUrl.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={postImageUrl.trim()} alt="Post preview" className="mt-3 w-full rounded-xl border border-border object-cover max-h-72" />
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/80 pt-4">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{previewStats}</span>
                {gender !== "any" ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    Creators: {gender === "male" ? "Male" : "Female"}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Any creator</span>
                )}
              </div>
              <ul className="mt-3 space-y-2 border-t border-border/80 pt-3 text-xs text-muted-foreground">
                {slotRows.slice(0, 5).map((row) => (
                  <li key={row.index} className="flex gap-2">
                    <span className="font-medium text-foreground">{row.label}</span>
                    {row.note.trim() ? (
                      <span className="line-clamp-1 min-w-0 text-muted-foreground">— {row.note.trim()}</span>
                    ) : (
                      <span className="italic opacity-70">No note</span>
                    )}
                  </li>
                ))}
                {slotRows.length > 5 ? (
                  <li className="text-muted-foreground">+{slotRows.length - 5} more…</li>
                ) : null}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              On phones, creators scroll a single column with the same content—your lineup and notes stay in order.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky publish */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <button className="btn primary w-full justify-center py-3.5 text-base" type="submit" form={FORM_ID} disabled={submitting}>
          {submitting ? "Publishing…" : "Publish campaign"}
        </button>
      </div>
    </div>
  );
}

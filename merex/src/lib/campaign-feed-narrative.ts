type NarrativeInput = {
  category?: "UGC" | "CLIPPING" | null;
  eligibility?: {
    genderAllowed?: string[] | null;
    minFollowers?: number | null;
    minEngagementRate?: number | null;
    niches?: string[] | null;
    allowedLocations?: string[] | null;
  } | null;
  deliverableCount?: number | null;
  deliverableKind?: string | null;
  deliverableSlots?: unknown;
  compensation?: {
    hasBarter?: boolean | null;
    fixedFeeAmount?: unknown;
    cpvRatePer1000?: unknown;
    barterNotes?: string | null;
  } | null;
  applicationDeadline?: Date | string | null;
  deliveryDueAt?: Date | string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  contentType?: string | null;
};

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function sentence(text: string): string | null {
  const clean = text.trim();
  if (!clean) return null;
  return clean.endsWith(".") ? clean : `${clean}.`;
}

export function buildCriteriaNarrative(input: NarrativeInput): string {
  const parts: string[] = [];
  const isClipping = input.category === "CLIPPING";

  // 1) Eligibility
  if (!isClipping) {
    const genders = (input.eligibility?.genderAllowed ?? []).filter(Boolean);
    const followerFloor = input.eligibility?.minFollowers ?? 0;
    const engagementFloor = input.eligibility?.minEngagementRate ?? 0;
    const niches = (input.eligibility?.niches ?? []).filter(Boolean);
    const eligibilityBits: string[] = [];
    if (genders.length > 0) eligibilityBits.push(`open to ${genders.join("/")}`);
    if (followerFloor > 0) eligibilityBits.push(`minimum ${followerFloor.toLocaleString("en-IN")} followers`);
    if (engagementFloor > 0) eligibilityBits.push(`at least ${engagementFloor}% engagement`);
    if (niches.length > 0) eligibilityBits.push(`preferred niches: ${niches.join(", ")}`);
    if (eligibilityBits.length > 0) parts.push(`Creator eligibility: ${eligibilityBits.join(", ")}`);
  }

  // 2) Deliverables
  if (!isClipping) {
    const deliverableCount = input.deliverableCount ?? 0;
    const deliverableKind = input.deliverableKind ? String(input.deliverableKind).toLowerCase() : null;
    const deliverableSentence =
      deliverableCount > 0
        ? `Deliverables include ${deliverableCount} ${deliverableKind ? `${deliverableKind} ` : ""}${deliverableCount === 1 ? "piece" : "pieces"} of content`
        : null;
    if (deliverableSentence) parts.push(deliverableSentence);
  }

  // 3) Compensation
  const fixed = toNumber(input.compensation?.fixedFeeAmount);
  const cpv = toNumber(input.compensation?.cpvRatePer1000);
  const compBits: string[] = [];
  if (!isClipping && fixed && fixed > 0) compBits.push(`- Fixed payout: ₹${fixed.toLocaleString("en-IN")}`);
  if (!isClipping && cpv && cpv > 0) compBits.push(`- CPV rate: ₹${cpv.toLocaleString("en-IN")} per 1,000 views`);
  if (input.compensation?.hasBarter) compBits.push("- Barter support: available");
  if (compBits.length > 0) parts.push(`Compensation terms:\n${compBits.join("\n")}`);

  // 4) Timeline
  const deadline = formatDate(input.applicationDeadline);
  const start = formatDate(input.startDate);
  const end = formatDate(input.endDate);
  const due = formatDate(input.deliveryDueAt);
  const timelineBits: string[] = [];
  if (deadline) timelineBits.push(`apply by ${deadline}`);
  if (start && end) timelineBits.push(`campaign window ${start} to ${end}`);
  else if (start) timelineBits.push(`campaign starts ${start}`);
  else if (end) timelineBits.push(`campaign ends ${end}`);
  if (due) timelineBits.push(`deliverables due by ${due}`);
  if (timelineBits.length > 0) parts.push(`Timeline: ${timelineBits.join(", ")}`);

  // 5) Remaining constraints
  const remaining: string[] = [];
  const locations = (input.eligibility?.allowedLocations ?? []).filter(Boolean);
  if (locations.length > 0) remaining.push(`locations: ${locations.join(", ")}`);
  if (input.compensation?.barterNotes?.trim()) remaining.push(input.compensation.barterNotes.trim());
  if (remaining.length > 0) parts.push(`Other notes: ${remaining.join(", ")}`);

  return parts
    .map((p) => sentence(p))
    .filter((p): p is string => Boolean(p))
    .join(" ");
}

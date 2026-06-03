import type { Requirement, RequirementDeliverableKind } from "@prisma/client";

export type DeliverableSlotKind = "REEL" | "STORY" | "POST";

export type DeliverableSlotItem = {
  kind: DeliverableSlotKind;
  note?: string;
};

export type DeliverableSlotsPayload = {
  slots: DeliverableSlotItem[];
};

const MAX_PER_KIND = 10;

export function parseDeliverableSlotsJson(raw: unknown): DeliverableSlotsPayload | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || raw === null) return null;
  const slots = (raw as { slots?: unknown }).slots;
  if (!Array.isArray(slots)) return null;
  const out: DeliverableSlotItem[] = [];
  const counts = { REEL: 0, STORY: 0, POST: 0 };
  for (const row of slots) {
    if (typeof row !== "object" || row === null || !("kind" in row)) return null;
    const k = (row as { kind: string }).kind;
    if (k !== "REEL" && k !== "STORY" && k !== "POST") return null;
    counts[k]++;
    if (counts[k] > MAX_PER_KIND) return null;
    const noteRaw = (row as { note?: unknown }).note;
    let note: string | undefined;
    if (noteRaw !== undefined && noteRaw !== null) {
      if (typeof noteRaw !== "string") return null;
      note = noteRaw.trim() || undefined;
    }
    out.push(note ? { kind: k, note } : { kind: k });
  }
  if (out.length === 0) return null;
  return { slots: out };
}

export function slotsFromRequirement(requirement: Requirement): DeliverableSlotItem[] {
  return slotsForOpportunityView({
    deliverableSlots: requirement.deliverableSlots,
    deliverableCount: requirement.deliverableCount,
    deliverableKind: requirement.deliverableKind
  });
}

/** Client-safe: same lineage resolution as DB rows, for API JSON / creator UI. */
export function slotsForOpportunityView(params: {
  deliverableSlots: unknown;
  deliverableCount?: number | null;
  deliverableKind?: string | null;
}): DeliverableSlotItem[] {
  const parsed = parseDeliverableSlotsJson(params.deliverableSlots);
  if (parsed) return parsed.slots;

  const kind = params.deliverableKind;
  const n = Math.max(1, params.deliverableCount ?? 1);
  const mapped: DeliverableSlotKind =
    kind === "STORY" ? "STORY" : kind === "REEL" ? "REEL" : kind === "POST" ? "POST" : "POST";
  return Array.from({ length: n }, () => ({ kind: mapped }));
}

export function prismaKindFromSlot(kind: DeliverableSlotKind): RequirementDeliverableKind {
  if (kind === "STORY") return "STORY";
  if (kind === "REEL") return "REEL";
  return "POST";
}

export function deliverableCountFromSlots(slots: { kind: DeliverableSlotKind }[]): number {
  return slots.length;
}

/** Human labels per kind index (Reel 1, Story 2, …) for UI parity between brand composer and creator view. */
export function labelDeliverableSlotRows(slots: DeliverableSlotItem[]): { label: string; kind: DeliverableSlotKind; note?: string }[] {
  const kindIndex: Record<DeliverableSlotKind, number> = { REEL: 0, STORY: 0, POST: 0 };
  return slots.map((s) => {
    const idx = kindIndex[s.kind]++;
    const base = s.kind === "REEL" ? "Reel" : s.kind === "STORY" ? "Story" : "Carousel";
    return { kind: s.kind, note: s.note, label: `${base} ${idx + 1}` };
  });
}

import { z } from "zod";
import { CREATOR_NICHE_SLUG_SET } from "@/lib/creator-niches";
import { districtBelongsToState, parseAllowedDistrictIds } from "@/lib/india-geography";

const deliverableSlotKind = z.enum(["REEL", "STORY", "POST"]);

const deliverableSlotsSchema = z
  .object({
    slots: z
      .array(
        z.object({
          kind: deliverableSlotKind,
          note: z.string().max(280).optional()
        })
      )
      .min(1)
      .max(30)
  })
  .superRefine((val, ctx) => {
    const counts = { REEL: 0, STORY: 0, POST: 0 };
    for (const s of val.slots) {
      counts[s.kind]++;
    }
    for (const k of ["REEL", "STORY", "POST"] as const) {
      if (counts[k] > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `At most 10 ${k} deliverables`
        });
      }
    }
  });

const eligibilitySchema = z.object({
  genderAllowed: z.array(z.string()).default([]),
  minFollowers: z.number().int().min(0).default(0),
  minEngagementRate: z.number().min(0).max(100).optional(),
  allowedLocations: z.array(z.string()).default([]),
  allowedDistrictIds: z.array(z.string()).default([]),
  niches: z
    .array(z.string())
    .max(10)
    .refine((arr) => new Set(arr).size === arr.length, "Duplicate niches")
    .refine((arr) => arr.length === 0 || arr.every((s) => CREATOR_NICHE_SLUG_SET.has(s)), "Invalid niche")
    .default([])
});

const compensationSchema = z.object({
  hasBarter: z.boolean().default(false),
  barterNotes: z.string().optional(),
  fixedFeeAmount: z.number().nonnegative().optional(),
  cpvRatePer1000: z.number().nonnegative().optional(),
  currency: z.string().default("INR")
});

const clippingSourceTypeSchema = z.enum([
  "YOUTUBE_VIDEO",
  "YOUTUBE_CHANNEL",
  "INSTAGRAM_PROFILE",
  "INSTAGRAM_POST",
  "GOOGLE_DRIVE_FILE",
  "GOOGLE_DRIVE_FOLDER",
  "REFERENCE_LINK"
]);

const clippingSourceItemSchema = z.object({
  type: clippingSourceTypeSchema,
  url: z.string().url(),
  label: z.string().max(120).optional()
});

const clippingMetaSchema = z.object({
  sourceItems: z.array(clippingSourceItemSchema).min(1).max(30),
  instructionBundle: z
    .object({
      hookStyle: z.string().max(240).optional(),
      pacing: z.string().max(240).optional(),
      ctaRules: z.string().max(400).optional(),
      bannedElements: z.array(z.string().max(140)).max(20).optional()
    })
    .optional(),
  outputRules: z
    .object({
      minSeconds: z.number().int().min(1).max(3600).optional(),
      maxSeconds: z.number().int().min(1).max(3600).optional(),
      orientation: z.enum(["VERTICAL", "HORIZONTAL", "SQUARE"]).optional(),
      captionTemplate: z.string().max(1000).optional()
    })
    .optional(),
  deliveryWindows: z
    .object({
      sampleDueAt: z.string().optional(),
      finalDueAt: z.string().optional()
    })
    .optional()
});

export const requirementSchema = z
  .object({
    title: z.string().min(5),
    brief: z.string().min(10),
    platforms: z.array(z.string()).min(1).default(["instagram"]),
    contentType: z.string().min(2),
    category: z.enum(["UGC", "CLIPPING"]).default("UGC"),
    clippingMeta: clippingMetaSchema.optional(),
    deliverableCount: z.number().int().min(1).optional(),
    deliverableKind: z.enum(["STORY", "REEL", "POST", "MIXED"]).optional(),
    deliverableSlots: deliverableSlotsSchema.optional(),
    applicationDeadline: z.string().optional(),
    deliveryDueAt: z.string().optional(),
    deliveryDueOffsetDays: z.number().int().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    postText: z.string().min(1).max(5000).optional(),
    postImageUrl: z.string().url().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
    eligibility: eligibilitySchema,
    compensation: compensationSchema
  })
  .superRefine((data, ctx) => {
    const c = data.compensation;
    const hasAny =
      c.hasBarter === true ||
      (c.fixedFeeAmount !== undefined && c.fixedFeeAmount > 0) ||
      (c.cpvRatePer1000 !== undefined && c.cpvRatePer1000 > 0);
    if (data.status === "PUBLISHED" && !hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose at least one compensation option (barter, fixed fee, or CPV)"
      });
    }
    if (!c.hasBarter && data.eligibility.allowedDistrictIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eligibility", "allowedDistrictIds"],
        message: "District targeting is only available when barter is enabled"
      });
    }
    if (c.hasBarter && data.eligibility.allowedDistrictIds.length > 0) {
      const cleaned = parseAllowedDistrictIds(data.eligibility.allowedDistrictIds);
      if (cleaned.length !== data.eligibility.allowedDistrictIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eligibility", "allowedDistrictIds"],
          message: "One or more district IDs are invalid"
        });
      }
    }
    const hasSlots = data.deliverableSlots && data.deliverableSlots.slots.length > 0;
    if (!hasSlots && (!data.deliverableCount || data.deliverableCount < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliverableSlots"],
        message: "Add at least one deliverable (or legacy deliverableCount)"
      });
    }
    if (data.category === "CLIPPING") {
      if (!data.clippingMeta || data.clippingMeta.sourceItems.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["clippingMeta", "sourceItems"],
          message: "Add at least one clipping source item"
        });
      }
    }
  });

export function normalizeRequirementPayload(
  parsed: z.infer<typeof requirementSchema>
): z.infer<typeof requirementSchema> & {
  eligibility: z.infer<typeof eligibilitySchema>;
} {
  const platforms =
    parsed.platforms.length > 0 ? parsed.platforms : (["instagram"] as string[]);
  const districtIds = parsed.compensation.hasBarter
    ? parseAllowedDistrictIds(parsed.eligibility.allowedDistrictIds)
    : [];
  let deliverableCount = parsed.deliverableCount ?? 1;
  let deliverableKind = parsed.deliverableKind;
  let deliverableSlots = parsed.deliverableSlots;
  if (parsed.deliverableSlots) {
    const cleaned = {
      slots: parsed.deliverableSlots.slots.map((s) => ({
        kind: s.kind,
        ...(s.note?.trim() ? { note: s.note.trim() } : {})
      }))
    };
    deliverableSlots = cleaned;
    deliverableCount = cleaned.slots.length;
    const kinds = new Set(cleaned.slots.map((s) => s.kind));
    if (kinds.size === 1) {
      const only = cleaned.slots[0]?.kind;
      deliverableKind = only === "STORY" ? "STORY" : only === "REEL" ? "REEL" : "POST";
    } else {
      deliverableKind = "MIXED";
    }
  }
  return {
    ...parsed,
    category: parsed.category ?? "UGC",
    clippingMeta: parsed.category === "CLIPPING" ? parsed.clippingMeta : undefined,
    postText: parsed.postText?.trim() || parsed.brief.trim(),
    postImageUrl: parsed.postImageUrl?.trim() || undefined,
    platforms,
    deliverableCount,
    deliverableKind,
    deliverableSlots,
    eligibility: {
      ...parsed.eligibility,
      allowedDistrictIds: districtIds
    }
  };
}

export const barterShippingSchema = z.object({
  shippingFullName: z.string().min(2),
  shippingPhone: z.string().min(8),
  shippingLine1: z.string().min(3),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(2),
  shippingState: z.string().min(2),
  shippingPincode: z.string().min(4),
  addressShareAcknowledged: z.literal(true)
});

export const applicationBodySchema = z.object({
  requirementId: z.string().min(10),
  pitch: z.string().max(2000).optional(),
  clippingDestinationHandle: z.string().max(80).optional(),
  acceptedTerms: z.literal(true),
  termsVersion: z.string().optional(),
  barterAccessAcknowledged: z.boolean().optional(),
  barterConsentVersion: z.string().optional(),
  shipping: barterShippingSchema.optional()
});

export const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "WAITLISTED"]),
  reason: z.string().max(500).optional()
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["CREATOR", "BUSINESS"]).optional(),
  primaryPersona: z.enum(["CREATOR", "EDITOR_PAGE"]).optional(),
  businessName: z.string().min(2).optional(),
  contactName: z.string().min(2).optional()
});

export const setPasswordSchema = z.object({
  password: z.string().min(8)
});

export const creatorProfileExtendedSchema = z
  .object({
    fullName: z.string().min(2),
    bio: z.string().optional(),
    gender: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.union([z.enum(["male", "female", "other"]), z.null()]).optional()
    ),
    niches: z
      .array(z.string())
      .min(1)
      .max(5)
      .refine((arr) => new Set(arr).size === arr.length, "Duplicate niches")
      .refine((arr) => arr.every((s) => CREATOR_NICHE_SLUG_SET.has(s)), "Invalid niche"),
    city: z.string().optional(),
    state: z.string().optional(),
    indiaStateId: z.string().nullable().optional(),
    indiaDistrictId: z.string().nullable().optional(),
    instagramHandle: z.string().optional(),
    primaryPersona: z.enum(["CREATOR", "EDITOR_PAGE"]).optional(),
    clippingEnabled: z.boolean().optional(),
    editorPageHandle: z.string().optional(),
    clippingCapabilities: z.array(z.string()).max(20).optional(),
    followerCount: z.number().int().min(0).default(0),
    postCount: z.number().int().min(0).default(0)
  })
  .superRefine((data, ctx) => {
    const hasState = Boolean(data.indiaStateId);
    const hasDistrict = Boolean(data.indiaDistrictId);
    if (hasState !== hasDistrict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select both state and district, or leave both empty"
      });
    }
    if (data.indiaStateId && data.indiaDistrictId) {
      if (!districtBelongsToState(data.indiaDistrictId, data.indiaStateId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indiaDistrictId"],
          message: "District does not belong to the selected state"
        });
      }
    }
  });

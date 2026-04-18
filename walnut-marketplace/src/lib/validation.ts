import { z } from "zod";

export const requirementSchema = z.object({
  title: z.string().min(5),
  brief: z.string().min(10),
  platforms: z.array(z.string()).min(1),
  contentType: z.string().min(2),
  deliverableCount: z.number().int().min(1),
  deliverableKind: z.enum(["STORY", "REEL", "POST", "MIXED"]).optional(),
  applicationDeadline: z.string().optional(),
  deliveryDueAt: z.string().optional(),
  deliveryDueOffsetDays: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
  eligibility: z.object({
    genderAllowed: z.array(z.string()).default([]),
    minFollowers: z.number().int().min(0).default(0),
    minEngagementRate: z.number().min(0).max(100).optional(),
    allowedLocations: z.array(z.string()).default([]),
    niches: z.array(z.string()).default([])
  }),
  compensation: z.object({
    hasBarter: z.boolean().default(false),
    barterNotes: z.string().optional(),
    fixedFeeAmount: z.number().nonnegative().optional(),
    cpvRatePer1000: z.number().nonnegative().optional(),
    currency: z.string().default("INR")
  })
});

export const applicationSchema = z.object({
  requirementId: z.string().min(10),
  pitch: z.string().max(2000).optional(),
  acceptedTerms: z.literal(true),
  termsVersion: z.string().optional(),
  barterAccessAcknowledged: z.boolean().optional(),
  barterConsentVersion: z.string().optional()
});

export const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "WAITLISTED"]),
  reason: z.string().max(500).optional()
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2)
});

export const setPasswordSchema = z.object({
  password: z.string().min(8)
});

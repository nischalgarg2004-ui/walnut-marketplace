/**
 * Seeds the live Merex demo business: loginable account, 5 published requirements,
 * and (when creators exist) sample applications so /business/applications is non-empty.
 *
 * Live login (same password as local prisma/seed demo users):
 *   Email: merex.postings@merex.demo
 *   Password: MerexDemo2026!
 *
 * Usage (requires DATABASE_URL):
 *   npx tsx scripts/seed-live-opportunities.ts
 *
 * Production / Neon:
 *   npx vercel env pull .env.production.vercel --environment production --yes
 *   PowerShell: $env:MEREX_ENV_FILE=".env.production.vercel"; npm run seed:opportunities
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { hashSync } from "bcryptjs";
import { config as loadEnv } from "dotenv";
import {
  ApplicationStatus,
  PrismaClient,
  RequirementStatus,
  UserRole
} from "@prisma/client";

function loadDatabaseUrlFromEnvFiles() {
  const explicit = process.env.MEREX_ENV_FILE;
  if (explicit) {
    loadEnv({ path: resolve(process.cwd(), explicit) });
    return;
  }
  for (const name of [".env.production.vercel", ".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (existsSync(p)) {
      loadEnv({ path: p });
      break;
    }
  }
}

loadDatabaseUrlFromEnvFiles();

const prisma = new PrismaClient();

/** Matches prisma/seed.ts DEMO_PASSWORD so one credential story for all demo accounts. */
const MEREX_BUSINESS_PASSWORD = "MerexDemo2026!";

const SEED_BUSINESS_EMAIL = "merex.postings@merex.demo";
const LEGACY_SEED_EMAIL = "live-feed-seed@merex.local";
const TITLE_PREFIX = "Merex:";

const opportunities: Array<{
  title: string;
  brief: string;
  platforms: string[];
  contentType: string;
  deliverableCount: number;
  eligibility: {
    genderAllowed: string[];
    minFollowers: number;
    minEngagementRate: number | null;
    allowedLocations: string[];
    niches: string[];
  };
  compensation: {
    hasBarter: boolean;
    barterNotes?: string;
    fixedFee: string | null;
    cpvPer1000: string | null;
  };
}> = [
  {
    title: `${TITLE_PREFIX} Monsoon skincare reel — metro creators`,
    brief:
      "30–45s Instagram Reel: AM routine featuring a rinse-off cleanser; natural light; Hindi or English voiceover; disclose partnership in caption.",
    platforms: ["instagram"],
    contentType: "ugc",
    deliverableCount: 1,
    eligibility: {
      genderAllowed: [],
      minFollowers: 2000,
      minEngagementRate: 2.5,
      allowedLocations: ["Mumbai", "Delhi", "Bengaluru"],
      niches: ["beauty-skincare"]
    },
    compensation: {
      hasBarter: true,
      barterNotes: "Full routine kit RRP ₹2,500",
      fixedFee: "1500",
      cpvPer1000: "180"
    }
  },
  {
    title: `${TITLE_PREFIX} Regional thali taste test — food creators`,
    brief:
      "Single vertical Reel trying 3 thali components; honest reactions; no health claims; tag the brand handle in caption.",
    platforms: ["instagram"],
    contentType: "ugc",
    deliverableCount: 1,
    eligibility: {
      genderAllowed: [],
      minFollowers: 8000,
      minEngagementRate: 3.5,
      allowedLocations: ["Ahmedabad", "Jaipur", "Hyderabad"],
      niches: ["food-reviews-restaurants", "regional-food-culture"]
    },
    compensation: { hasBarter: false, fixedFee: "2500", cpvPer1000: "220" }
  },
  {
    title: `${TITLE_PREFIX} Monsoon weekend getaway — travel Reels`,
    brief:
      "45–60s Reel: one destination hook in first 3s; budget tip + one brand mention; vertical only; English or Hinglish.",
    platforms: ["instagram"],
    contentType: "ugc",
    deliverableCount: 1,
    eligibility: {
      genderAllowed: [],
      minFollowers: 15000,
      minEngagementRate: 2.8,
      allowedLocations: ["Pune", "Kochi", "Goa"],
      niches: ["travel-explore-india", "daily-vlogging"]
    },
    compensation: {
      hasBarter: true,
      barterNotes: "Stay voucher T&C apply (cap ₹8k)",
      fixedFee: "4000",
      cpvPer1000: "200"
    }
  },
  {
    title: `${TITLE_PREFIX} Budget TWS unboxing — tech POV`,
    brief:
      "Unboxing + pairing + 30s mic sample; no spec claims beyond press kit; show product in hand; YouTube Shorts or IG Reel.",
    platforms: ["instagram", "youtube"],
    contentType: "ugc",
    deliverableCount: 1,
    eligibility: {
      genderAllowed: [],
      minFollowers: 40000,
      minEngagementRate: 2,
      allowedLocations: ["Delhi", "Bengaluru", "Chennai"],
      niches: ["tech-gadgets"]
    },
    compensation: {
      hasBarter: true,
      barterNotes: "Review unit (return or keep per contract)",
      fixedFee: "3500",
      cpvPer1000: "280"
    }
  },
  {
    title: `${TITLE_PREFIX} Athleisure OOTD carousel + Reel`,
    brief:
      "One carousel (5–7 slides) + one 20s Reel stitch; focus on fit and fabric; Gen-Z tone; brand logo on last slide.",
    platforms: ["instagram"],
    contentType: "ugc",
    deliverableCount: 2,
    eligibility: {
      genderAllowed: ["female", "male"],
      minFollowers: 12000,
      minEngagementRate: 3,
      allowedLocations: [],
      niches: ["fashion-styling", "daily-vlogging"]
    },
    compensation: { hasBarter: false, fixedFee: "6000", cpvPer1000: "150" }
  }
];

function decimalOrNull(v: string | null | undefined) {
  if (v === null || v === undefined) return null;
  return v;
}

async function main() {
  const passwordHash = hashSync(MEREX_BUSINESS_PASSWORD, 10);

  const legacy = await prisma.user.findUnique({ where: { email: LEGACY_SEED_EMAIL } });
  if (legacy) {
    await prisma.user.delete({ where: { id: legacy.id } });
    console.log("Removed legacy seed user:", LEGACY_SEED_EMAIL);
  }

  const user = await prisma.user.upsert({
    where: { email: SEED_BUSINESS_EMAIL },
    update: {
      role: UserRole.BUSINESS,
      passwordHash
    },
    create: {
      email: SEED_BUSINESS_EMAIL,
      role: UserRole.BUSINESS,
      passwordHash
    }
  });

  const profile = await prisma.businessProfile.upsert({
    where: { userId: user.id },
    update: {
      legalName: "Merex Pvt Ltd (Demo)",
      brandName: "Merex",
      category: "Marketplace demo",
      website: "https://merex-marketplace.vercel.app",
      billingEmail: SEED_BUSINESS_EMAIL
    },
    create: {
      userId: user.id,
      legalName: "Merex Pvt Ltd (Demo)",
      brandName: "Merex",
      category: "Marketplace demo",
      website: "https://merex-marketplace.vercel.app",
      billingEmail: SEED_BUSINESS_EMAIL
    }
  });

  await prisma.requirement.deleteMany({
    where: {
      businessId: profile.id,
      OR: [{ title: { startsWith: TITLE_PREFIX } }, { title: { startsWith: "Walnut Demo:" } }, { title: { startsWith: "Walnut:" } }]
    }
  });

  const createdReqIds: string[] = [];

  for (const r of opportunities) {
    const row = await prisma.requirement.create({
      data: {
        businessId: profile.id,
        title: r.title,
        brief: r.brief,
        platforms: r.platforms,
        contentType: r.contentType,
        deliverableCount: r.deliverableCount,
        status: RequirementStatus.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        eligibility: {
          create: {
            genderAllowed: r.eligibility.genderAllowed,
            minFollowers: r.eligibility.minFollowers,
            minEngagementRate: r.eligibility.minEngagementRate,
            allowedLocations: r.eligibility.allowedLocations,
            allowedDistrictIds: [],
            niches: r.eligibility.niches
          }
        },
        compensation: {
          create: {
            hasBarter: r.compensation.hasBarter,
            barterNotes: r.compensation.barterNotes ?? null,
            fixedFeeAmount: decimalOrNull(r.compensation.fixedFee),
            cpvRatePer1000: decimalOrNull(r.compensation.cpvPer1000),
            currency: "INR"
          }
        }
      }
    });
    createdReqIds.push(row.id);
  }

  const creators = await prisma.creatorProfile.findMany({
    orderBy: { id: "asc" },
    take: 3
  });

  let sampleApplications = 0;
  if (creators.length > 0 && createdReqIds.length >= 2) {
    const pairs: { requirementId: string; creatorId: string; pitch: string; status: ApplicationStatus }[] = [
      {
        requirementId: createdReqIds[0],
        creatorId: creators[0].id,
        pitch: "Demo application: love skincare UGC; can deliver Hindi + English variants.",
        status: ApplicationStatus.APPLIED
      },
      {
        requirementId: createdReqIds[1],
        creatorId: creators[Math.min(1, creators.length - 1)].id,
        pitch: "Demo: street food content weekly; based in India.",
        status: ApplicationStatus.WAITLISTED
      }
    ];
    if (creators.length >= 3 && createdReqIds.length >= 3) {
      pairs.push({
        requirementId: createdReqIds[2],
        creatorId: creators[2].id,
        pitch: "Demo: travel Reels with 45k+ followers; portfolio on request.",
        status: ApplicationStatus.APPLIED
      });
    }

    for (const p of pairs) {
      const dup = await prisma.application.findFirst({
        where: { requirementId: p.requirementId, creatorId: p.creatorId }
      });
      if (dup) continue;
      await prisma.application.create({
        data: {
          requirementId: p.requirementId,
          creatorId: p.creatorId,
          pitch: p.pitch,
          status: p.status
        }
      });
      sampleApplications += 1;
    }
  }

  const count = await prisma.requirement.count({
    where: { businessId: profile.id, status: RequirementStatus.PUBLISHED }
  });

  console.log("Merex live seed complete.", {
    loginEmail: SEED_BUSINESS_EMAIL,
    loginPassword: MEREX_BUSINESS_PASSWORD,
    brandName: profile.brandName,
    publishedRequirements: count,
    sampleApplicationsCreated: sampleApplications,
    titles: opportunities.map((o) => o.title)
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

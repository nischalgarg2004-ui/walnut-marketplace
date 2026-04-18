import { hashSync } from "bcryptjs";
import { InstagramAccountType, PrismaClient, RequirementStatus, UserRole } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "WalnutDemo2026!";

type CreatorSeed = {
  email: string;
  fullName: string;
  bio: string;
  gender: string;
  niches: string[];
  city: string;
  state: string;
  instagramHandle: string;
  followerCount: number;
  avgEngagement: number;
};

type BusinessSeed = {
  email: string;
  legalName: string;
  brandName: string;
  category: string;
  website: string;
  billingEmail: string;
  gstinPlaceholder?: string;
};

type ReqSeed = {
  title: string;
  brief: string;
  platforms: readonly string[];
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
};

const creators: CreatorSeed[] = [
  {
    email: "priya.sharma@walnut.demo",
    fullName: "Priya Sharma",
    bio: "Skincare and glow routines; reel-first storytelling.",
    gender: "female",
    niches: ["beauty", "skincare"],
    city: "Mumbai",
    state: "Maharashtra",
    instagramHandle: "priya.ugc.mumbai",
    followerCount: 8500,
    avgEngagement: 4.2
  },
  {
    email: "rahul.verma@walnut.demo",
    fullName: "Rahul Verma",
    bio: "Tech unboxings and honest gadget reviews.",
    gender: "male",
    niches: ["tech", "gadgets"],
    city: "Delhi",
    state: "Delhi",
    instagramHandle: "rahul.tech.delhi",
    followerCount: 120000,
    avgEngagement: 2.1
  },
  {
    email: "ananya.iyer@walnut.demo",
    fullName: "Ananya Iyer",
    bio: "Lifestyle vlogs and home aesthetic.",
    gender: "female",
    niches: ["lifestyle", "home"],
    city: "Bengaluru",
    state: "Karnataka",
    instagramHandle: "ananya.life.blr",
    followerCount: 45000,
    avgEngagement: 3.5
  },
  {
    email: "kunal.patel@walnut.demo",
    fullName: "Kunal Patel",
    bio: "Street food reviews and regional recipes.",
    gender: "male",
    niches: ["food", "streetfood"],
    city: "Ahmedabad",
    state: "Gujarat",
    instagramHandle: "kunal.eats.ahm",
    followerCount: 22000,
    avgEngagement: 5.1
  },
  {
    email: "sneha.reddy@walnut.demo",
    fullName: "Sneha Reddy",
    bio: "Micro skincare; authentic before/afters.",
    gender: "female",
    niches: ["skincare", "beauty"],
    city: "Hyderabad",
    state: "Telangana",
    instagramHandle: "sneha.skin.hyd",
    followerCount: 1800,
    avgEngagement: 6.2
  },
  {
    email: "vikram.singh@walnut.demo",
    fullName: "Vikram Singh",
    bio: "Gym routines and supplement education.",
    gender: "male",
    niches: ["fitness", "wellness"],
    city: "Pune",
    state: "Maharashtra",
    instagramHandle: "vikram.lift.pune",
    followerCount: 95000,
    avgEngagement: 2.8
  },
  {
    email: "meera.nair@walnut.demo",
    fullName: "Meera Nair",
    bio: "Weekend travel and budget itineraries.",
    gender: "female",
    niches: ["travel", "lifestyle"],
    city: "Kochi",
    state: "Kerala",
    instagramHandle: "meera.wander.kochi",
    followerCount: 67000,
    avgEngagement: 4.0
  },
  {
    email: "arjun.mehta@walnut.demo",
    fullName: "Arjun Mehta",
    bio: "Short comedy skits and relatable humor.",
    gender: "male",
    niches: ["comedy", "entertainment"],
    city: "Jaipur",
    state: "Rajasthan",
    instagramHandle: "arjun.laughs.jpr",
    followerCount: 200000,
    avgEngagement: 1.9
  },
  {
    email: "divya.krishnan@walnut.demo",
    fullName: "Divya Krishnan",
    bio: "Outfit transitions and thrift styling.",
    gender: "female",
    niches: ["fashion", "style"],
    city: "Chennai",
    state: "Tamil Nadu",
    instagramHandle: "divya.style.chn",
    followerCount: 34000,
    avgEngagement: 3.9
  },
  {
    email: "rohit.bose@walnut.demo",
    fullName: "Rohit Bose",
    bio: "Mobile gaming clips and esports commentary.",
    gender: "male",
    niches: ["gaming", "esports"],
    city: "Kolkata",
    state: "West Bengal",
    instagramHandle: "rohit.gg.kol",
    followerCount: 56000,
    avgEngagement: 3.0
  }
];

const businesses: BusinessSeed[] = [
  {
    email: "brand.glowskin@walnut.demo",
    legalName: "GlowSkin Labs Pvt Ltd",
    brandName: "GlowSkin",
    category: "Beauty & Personal Care",
    website: "https://glowskin.walnut.demo",
    billingEmail: "billing@glowskin.walnut.demo",
    gstinPlaceholder: "27AAAAA0000A1Z5"
  },
  {
    email: "brand.fitfuel@walnut.demo",
    legalName: "FitFuel Nutrition India LLP",
    brandName: "FitFuel",
    category: "Health & Nutrition",
    website: "https://fitfuel.walnut.demo",
    billingEmail: "ap@fitfuel.walnut.demo",
    gstinPlaceholder: "29BBBBB0000B1Z4"
  },
  {
    email: "brand.technova@walnut.demo",
    legalName: "TechNova India Private Limited",
    brandName: "TechNova",
    category: "Consumer Electronics",
    website: "https://technova.walnut.demo",
    billingEmail: "finance@technova.walnut.demo",
    gstinPlaceholder: "07CCCCC0000C1Z3"
  },
  {
    email: "brand.spiceroute@walnut.demo",
    legalName: "SpiceRoute Foods Pvt Ltd",
    brandName: "SpiceRoute",
    category: "Food & Beverage",
    website: "https://spiceroute.walnut.demo",
    billingEmail: "accounts@spiceroute.walnut.demo",
    gstinPlaceholder: "24DDDDD0000D1Z2"
  },
  {
    email: "brand.wanderfest@walnut.demo",
    legalName: "WanderFest Travel Co.",
    brandName: "WanderFest",
    category: "Travel & Hospitality",
    website: "https://wanderfest.walnut.demo",
    billingEmail: "ops@wanderfest.walnut.demo",
    gstinPlaceholder: "33EEEEE0000E1Z1"
  }
];

function requirementsForBrand(brandKey: string): ReqSeed[] {
  const common = {
    platforms: ["instagram"],
    contentType: "ugc",
    deliverableCount: 1
  } as const;

  const sets: Record<string, ReqSeed[]> = {
    GlowSkin: [
      {
        ...common,
        title: "Vitamin C Serum UGC — Summer 2026",
        brief: "30–45s reel showing AM routine with product on face; natural light; Hindi or English.",
        eligibility: {
          genderAllowed: ["female"],
          minFollowers: 2000,
          minEngagementRate: 3,
          allowedLocations: ["Mumbai", "Delhi", "Bengaluru"],
          niches: ["beauty", "skincare"]
        },
        compensation: { hasBarter: true, barterNotes: "Full-size serum shipped", fixedFee: "0", cpvPer1000: "250" }
      },
      {
        ...common,
        title: "Under-eye cream — Before/After style",
        brief: "Authentic 7-day transformation format; disclose partnership.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 5000,
          minEngagementRate: 2.5,
          allowedLocations: [],
          niches: ["skincare"]
        },
        compensation: { hasBarter: false, fixedFee: "1000", cpvPer1000: "150" }
      },
      {
        ...common,
        title: "Sunscreen launch — SPF story",
        brief: "Outdoor shoot; mention skin types; tag brand handle.",
        eligibility: {
          genderAllowed: ["female", "male"],
          minFollowers: 8000,
          minEngagementRate: null,
          allowedLocations: ["Mumbai", "Chennai", "Hyderabad"],
          niches: ["beauty", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "Product + ₹500 flat", fixedFee: "500", cpvPer1000: "200" }
      },
      {
        ...common,
        deliverableCount: 2,
        title: "Night cream duo — 2 reels",
        brief: "Two vertical reels: routine + results clip.",
        eligibility: {
          genderAllowed: ["female"],
          minFollowers: 10000,
          minEngagementRate: 3.5,
          allowedLocations: [],
          niches: ["beauty"]
        },
        compensation: { hasBarter: false, fixedFee: "2500", cpvPer1000: null }
      },
      {
        ...common,
        title: "Micro-influencer barter — Lip balm",
        brief: "Unboxing + first impression; under 60s.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 1500,
          minEngagementRate: 4,
          allowedLocations: ["Pune", "Kochi", "Kolkata"],
          niches: ["beauty", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "Lip balm kit only", fixedFee: "0", cpvPer1000: "0" }
      }
    ],
    FitFuel: [
      {
        ...common,
        title: "Protein shake — Gym morning routine",
        brief: "Show prep, shake mix, post-workout feel.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 20000,
          minEngagementRate: 2,
          allowedLocations: ["Delhi", "Pune", "Bengaluru"],
          niches: ["fitness", "wellness"]
        },
        compensation: { hasBarter: true, barterNotes: "2kg protein tub", fixedFee: "1500", cpvPer1000: "120" }
      },
      {
        ...common,
        title: "Energy bar taste test — Street format",
        brief: "Authentic reaction; no medical claims.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 15000,
          minEngagementRate: 3,
          allowedLocations: [],
          niches: ["food", "fitness"]
        },
        compensation: { hasBarter: false, fixedFee: "800", cpvPer1000: "100" }
      },
      {
        ...common,
        title: "Electrolytes summer campaign",
        brief: "Hydration hook in first 3 seconds.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 50000,
          minEngagementRate: null,
          allowedLocations: ["Mumbai", "Chennai"],
          niches: ["fitness", "lifestyle"]
        },
        compensation: { hasBarter: false, fixedFee: "0", cpvPer1000: "300" }
      },
      {
        ...common,
        title: "Meal replacement — Day-in-life",
        brief: "One full day integration story.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 35000,
          minEngagementRate: 2.8,
          allowedLocations: ["Ahmedabad", "Jaipur"],
          niches: ["wellness", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "7-day sample box", fixedFee: "2000", cpvPer1000: null }
      },
      {
        ...common,
        title: "Creatine education — Explainer reel",
        brief: "Science-simple; brand disclaimer on screen.",
        eligibility: {
          genderAllowed: ["male", "female"],
          minFollowers: 8000,
          minEngagementRate: 2.5,
          allowedLocations: [],
          niches: ["fitness"]
        },
        compensation: { hasBarter: false, fixedFee: "1200", cpvPer1000: "80" }
      }
    ],
    TechNova: [
      {
        ...common,
        platforms: ["instagram", "youtube"],
        title: "Wireless earbuds — Unboxing POV",
        brief: "Show pairing, case, and mic test.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 50000,
          minEngagementRate: 2,
          allowedLocations: ["Delhi", "Bengaluru"],
          niches: ["tech", "gadgets"]
        },
        compensation: { hasBarter: true, barterNotes: "Retail unit for review", fixedFee: "3000", cpvPer1000: "400" }
      },
      {
        ...common,
        title: "Smartwatch fitness tracking demo",
        brief: "Compare steps vs phone; no spec fabrication.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 40000,
          minEngagementRate: 2.2,
          allowedLocations: [],
          niches: ["tech", "fitness"]
        },
        compensation: { hasBarter: false, fixedFee: "5000", cpvPer1000: "250" }
      },
      {
        ...common,
        title: "Budget phone camera test",
        brief: "Low-light versus daylight samples.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 100000,
          minEngagementRate: 1.8,
          allowedLocations: ["Mumbai", "Hyderabad"],
          niches: ["tech"]
        },
        compensation: { hasBarter: false, fixedFee: "0", cpvPer1000: "350" }
      },
      {
        ...common,
        title: "Noise-cancelling headphones — Commute story",
        brief: "Metro/bus ambience + ANC demo.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 25000,
          minEngagementRate: 3,
          allowedLocations: ["Kolkata", "Chennai"],
          niches: ["tech", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "Loaner unit 14 days", fixedFee: "1500", cpvPer1000: "180" }
      },
      {
        ...common,
        title: "Gaming phone — FPS clip highlights",
        brief: "Vertical gameplay capture with device in frame.",
        eligibility: {
          genderAllowed: ["male", "female"],
          minFollowers: 60000,
          minEngagementRate: 2.5,
          allowedLocations: [],
          niches: ["gaming", "tech"]
        },
        compensation: { hasBarter: false, fixedFee: "4000", cpvPer1000: "300" }
      }
    ],
    SpiceRoute: [
      {
        ...common,
        title: "Regional snack pack — Taste reaction",
        brief: "3 flavours in one reel; honest reactions.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 10000,
          minEngagementRate: 4,
          allowedLocations: ["Ahmedabad", "Jaipur", "Delhi"],
          niches: ["food", "streetfood"]
        },
        compensation: { hasBarter: true, barterNotes: "Sample pack", fixedFee: "500", cpvPer1000: "200" }
      },
      {
        ...common,
        title: "Ready-to-cook paste — 15 min recipe",
        brief: "Home kitchen only; show packaging.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 8000,
          minEngagementRate: 3.5,
          allowedLocations: [],
          niches: ["food", "lifestyle"]
        },
        compensation: { hasBarter: false, fixedFee: "1200", cpvPer1000: "150" }
      },
      {
        ...common,
        title: "Iced tea launch — Summer thirst",
        brief: "Colour-forward table setup.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 20000,
          minEngagementRate: null,
          allowedLocations: ["Mumbai", "Pune"],
          niches: ["food", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "Product crates", fixedFee: "0", cpvPer1000: "220" }
      },
      {
        ...common,
        title: "Chutney pairings — Regional twist",
        brief: "Show 2 dishes with chutney hero.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 5000,
          minEngagementRate: 4.5,
          allowedLocations: ["Bengaluru", "Chennai", "Kochi"],
          niches: ["food"]
        },
        compensation: { hasBarter: false, fixedFee: "900", cpvPer1000: null }
      },
      {
        ...common,
        title: "Midnight munchies — Hostel room skit",
        brief: "Comedy beat optional; product visible in B-roll.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 30000,
          minEngagementRate: 3,
          allowedLocations: [],
          niches: ["food", "comedy"]
        },
        compensation: { hasBarter: true, barterNotes: "Coupon codes for audience", fixedFee: "700", cpvPer1000: "130" }
      }
    ],
    WanderFest: [
      {
        ...common,
        title: "Weekend getaway — 60s destination teaser",
        brief: "Drone shots optional; mention package in caption.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 25000,
          minEngagementRate: 3,
          allowedLocations: ["Mumbai", "Delhi", "Bengaluru"],
          niches: ["travel", "lifestyle"]
        },
        compensation: { hasBarter: false, fixedFee: "5000", cpvPer1000: "280" }
      },
      {
        ...common,
        title: "Monsoon hill station — mood film",
        brief: "Voice-over or text-on-screen OK.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 40000,
          minEngagementRate: 2.5,
          allowedLocations: ["Pune", "Kochi"],
          niches: ["travel"]
        },
        compensation: { hasBarter: true, barterNotes: "2D/1N voucher (T&C)", fixedFee: "2000", cpvPer1000: "200" }
      },
      {
        ...common,
        title: "Heritage walk — Local guide energy",
        brief: "Walk-and-talk; tag city loudly.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 15000,
          minEngagementRate: 4,
          allowedLocations: ["Jaipur", "Kolkata", "Chennai"],
          niches: ["travel", "lifestyle"]
        },
        compensation: { hasBarter: false, fixedFee: "1500", cpvPer1000: "180" }
      },
      {
        ...common,
        title: "Backpacking budget tips — Listicle reel",
        brief: "5 tips format; brand logo end card.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 60000,
          minEngagementRate: null,
          allowedLocations: [],
          niches: ["travel"]
        },
        compensation: { hasBarter: false, fixedFee: "0", cpvPer1000: "320" }
      },
      {
        ...common,
        title: "Beach clean-up + travel pass",
        brief: "Purpose-led; partner disclosure required.",
        eligibility: {
          genderAllowed: [],
          minFollowers: 20000,
          minEngagementRate: 3.2,
          allowedLocations: ["Chennai", "Hyderabad", "Mumbai"],
          niches: ["travel", "lifestyle"]
        },
        compensation: { hasBarter: true, barterNotes: "Eco kit + tote", fixedFee: "3000", cpvPer1000: "150" }
      }
    ]
  };

  return sets[brandKey] ?? [];
}

function decimalOrNull(v: string | null | undefined) {
  if (v === null || v === undefined) return null;
  return v;
}

async function main() {
  const passwordHash = hashSync(DEMO_PASSWORD, 10);

  const creatorRecords: { email: string; id: string }[] = [];
  for (const c of creators) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, role: UserRole.CREATOR },
      create: {
        email: c.email,
        passwordHash,
        role: UserRole.CREATOR
      }
    });

    await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: c.fullName,
        bio: c.bio,
        gender: c.gender,
        niches: c.niches,
        city: c.city,
        state: c.state,
        instagramHandle: c.instagramHandle,
        instagramUsername: c.instagramHandle,
        instagramUserId: `seed_${c.instagramHandle}`,
        instagramAccountType: InstagramAccountType.CREATOR,
        instagramConnectedAt: new Date(),
        instagramAccessTokenEncrypted: "seed_token",
        followerCount: c.followerCount,
        avgEngagement: c.avgEngagement
      },
      create: {
        userId: user.id,
        fullName: c.fullName,
        bio: c.bio,
        gender: c.gender,
        niches: c.niches,
        city: c.city,
        state: c.state,
        instagramHandle: c.instagramHandle,
        instagramUsername: c.instagramHandle,
        instagramUserId: `seed_${c.instagramHandle}`,
        instagramAccountType: InstagramAccountType.CREATOR,
        instagramConnectedAt: new Date(),
        instagramAccessTokenEncrypted: "seed_token",
        followerCount: c.followerCount,
        avgEngagement: c.avgEngagement
      }
    });

    creatorRecords.push({ email: user.email, id: user.id });
  }

  const businessRecords: {
    email: string;
    id: string;
    brandName: string;
    requirements: { title: string }[];
  }[] = [];

  for (const b of businesses) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: { passwordHash, role: UserRole.BUSINESS },
      create: {
        email: b.email,
        passwordHash,
        role: UserRole.BUSINESS
      }
    });

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {
        legalName: b.legalName,
        brandName: b.brandName,
        category: b.category,
        website: b.website,
        billingEmail: b.billingEmail,
        gstinPlaceholder: b.gstinPlaceholder ?? null
      },
      create: {
        userId: user.id,
        legalName: b.legalName,
        brandName: b.brandName,
        category: b.category,
        website: b.website,
        billingEmail: b.billingEmail,
        gstinPlaceholder: b.gstinPlaceholder
      }
    });

    await prisma.requirement.deleteMany({ where: { businessId: profile.id } });

    const reqs = requirementsForBrand(b.brandName);
    const createdReqs: { title: string }[] = [];

    for (const r of reqs) {
      const row = await prisma.requirement.create({
        data: {
          businessId: profile.id,
          title: r.title,
          brief: r.brief,
          platforms: [...r.platforms],
          contentType: r.contentType,
          deliverableCount: r.deliverableCount,
          status: RequirementStatus.PUBLISHED,
          eligibility: {
            create: {
              genderAllowed: r.eligibility.genderAllowed,
              minFollowers: r.eligibility.minFollowers,
              minEngagementRate: r.eligibility.minEngagementRate ?? null,
              allowedLocations: r.eligibility.allowedLocations,
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
      createdReqs.push({ title: row.title });
    }

    businessRecords.push({
      email: user.email,
      id: user.id,
      brandName: b.brandName,
      requirements: createdReqs
    });
  }

  const adminEmail = "admin@walnut.demo";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.ADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const dummyVars = {
    note: "Local/demo only. Change DEMO_PASSWORD in prisma/seed.ts and re-seed for your machine.",
    defaultPassword: DEMO_PASSWORD,
    admin: { email: adminEmail, password: DEMO_PASSWORD, role: "ADMIN" },
    creators: creators.map((c) => ({
      email: c.email,
      password: DEMO_PASSWORD,
      role: "CREATOR",
      fullName: c.fullName,
      gender: c.gender,
      city: c.city,
      state: c.state,
      niches: c.niches,
      followerCount: c.followerCount,
      avgEngagement: c.avgEngagement,
      instagramHandle: c.instagramHandle
    })),
    businesses: businesses.map((b) => ({
      email: b.email,
      password: DEMO_PASSWORD,
      role: "BUSINESS",
      legalName: b.legalName,
      brandName: b.brandName,
      category: b.category,
      website: b.website,
      postingsCount: 5
    })),
    urls: {
      login: "/login",
      creatorHome: "/creator/dashboard",
      creatorProfile: "/creator/profile",
      creatorFeed: "/creator/dashboard",
      creatorApplications: "/creator/applications",
      creatorProjects: "/creator/projects",
      creatorEarnings: "/creator/earnings",
      businessHome: "/business",
      businessProfile: "/business/profile",
      businessPost: "/business/requirements",
      businessApps: "/business/applications",
      adminHome: "/admin"
    }
  };

  const publishedCount = await prisma.requirement.count({
    where: { status: RequirementStatus.PUBLISHED }
  });
  if (publishedCount < 5) {
    throw new Error(`Seed must create at least 5 published opportunities, got ${publishedCount}`);
  }

  const outPath = path.join(process.cwd(), "dummy_vars.json");
  fs.writeFileSync(outPath, JSON.stringify(dummyVars, null, 2), "utf8");

  console.log("Seed complete.", {
    creators: creatorRecords.length,
    businesses: businessRecords.length,
    requirementsTotal: businessRecords.reduce((a, x) => a + x.requirements.length, 0),
    adminEmail,
    dummyVarsFile: outPath
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

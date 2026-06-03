/**
 * seed-meta-review-demo.ts
 *
 * Seeds a complete demo scenario for the Meta App Review submission:
 * - A dedicated demo creator account (meta-review@merex.in)
 * - A demo business + campaign requirement (published)
 * - An approved application
 * - An ACTIVE contract on that application
 * - A deliverable with a real public Instagram Reel URL submitted
 *
 * Usage:
 *   npx tsx scripts/seed-meta-review-demo.ts
 *
 * This is SAFE to run on production — it uses upsert (idempotent).
 * The demo account can log in via https://www.merex.in/login/creator
 * with email: meta-review-creator@merex.in  password: MetaReview2026!
 *
 * After running, note down the contractId printed at the end.
 */

import { PrismaClient, ContractStatus, ApplicationStatus, DeliverableStatus, RequirementStatus } from "@prisma/client";
import { hashSync } from "bcryptjs";

const db = new PrismaClient();

// ─── Config ─────────────────────────────────────────────────────────────────
const CREATOR_EMAIL = "meta-review-creator@merex.in";
const CREATOR_PASSWORD = "MetaReview2026!";
const BUSINESS_EMAIL = "meta-review-brand@merex.in";
const BUSINESS_PASSWORD = "MetaReview2026!";

/**
 * A real, publicly accessible Instagram Reel URL that shows in the demo.
 * Replace with a real Reel URL from a professional/business account.
 * The media ID will be resolved by the app when the reviewer clicks
 * "Refresh Metrics".
 */
const DEMO_REEL_URL = "https://www.instagram.com/reel/REPLACE_WITH_REAL_REEL_ID/";

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const creatorHash = hashSync(CREATOR_PASSWORD, 10);
  const businessHash = hashSync(BUSINESS_PASSWORD, 10);

  console.log("1/7 Upserting demo creator user…");
  const creatorUser = await db.user.upsert({
    where: { email: CREATOR_EMAIL },
    update: { passwordHash: creatorHash, role: "CREATOR", status: "ACTIVE" },
    create: { email: CREATOR_EMAIL, passwordHash: creatorHash, role: "CREATOR", status: "ACTIVE" }
  });

  console.log("2/7 Upserting demo creator profile…");
  const creatorProfile = await db.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    update: {
      fullName: "Demo Creator (Meta Review)",
      bio: "This account is used to demonstrate Merex for Meta App Review.",
      instagramHandle: "demo.merex.creator",
      instagramUsername: "demo.merex.creator",
      // NOTE: instagramUserId and instagramAccessTokenEncrypted will be set
      // when the demo account connects their real Instagram account via OAuth.
      // If you want to pre-populate with a real token, set them here.
      followerCount: 15000,
      postCount: 45,
      avgEngagement: 4.5
    },
    create: {
      userId: creatorUser.id,
      fullName: "Demo Creator (Meta Review)",
      bio: "This account is used to demonstrate Merex for Meta App Review.",
      instagramHandle: "demo.merex.creator",
      instagramUsername: "demo.merex.creator",
      followerCount: 15000,
      postCount: 45,
      avgEngagement: 4.5
    }
  });

  console.log("3/7 Upserting demo business user…");
  const businessUser = await db.user.upsert({
    where: { email: BUSINESS_EMAIL },
    update: { passwordHash: businessHash, role: "BUSINESS", status: "ACTIVE" },
    create: { email: BUSINESS_EMAIL, passwordHash: businessHash, role: "BUSINESS", status: "ACTIVE" }
  });

  console.log("4/7 Upserting demo business profile…");
  const businessProfile = await db.businessProfile.upsert({
    where: { userId: businessUser.id },
    update: {
      legalName: "Merex Demo Brand Pvt Ltd",
      brandName: "Merex Demo Brand",
      category: "Technology",
      website: "https://merex.in",
      billingEmail: "billing@merex.in",
      verificationStatus: "VERIFIED"
    },
    create: {
      userId: businessUser.id,
      legalName: "Merex Demo Brand Pvt Ltd",
      brandName: "Merex Demo Brand",
      category: "Technology",
      website: "https://merex.in",
      billingEmail: "billing@merex.in",
      verificationStatus: "VERIFIED"
    }
  });

  console.log("5/7 Creating demo requirement (campaign)…");
  // Delete any existing requirements for this business to keep it clean
  const existingReq = await db.requirement.findFirst({
    where: { businessId: businessProfile.id, title: "Meta App Review Demo Campaign" }
  });

  let requirement;
  if (existingReq) {
    requirement = existingReq;
    console.log("   Using existing requirement:", requirement.id);
  } else {
    requirement = await db.requirement.create({
      data: {
        businessId: businessProfile.id,
        title: "Meta App Review Demo Campaign",
        brief: "This is a demo campaign created for Meta App Review purposes. The creator will publish a short Reel demonstrating the Merex platform.",
        platforms: ["instagram"],
        contentType: "ugc",
        deliverableCount: 1,
        status: RequirementStatus.PUBLISHED,
        eligibility: {
          create: {
            genderAllowed: [],
            minFollowers: 1000,
            minEngagementRate: null,
            allowedLocations: [],
            allowedDistrictIds: [],
            niches: ["tech-gadgets"]
          }
        },
        compensation: {
          create: {
            hasBarter: false,
            fixedFeeAmount: "2500",
            cpvRatePer1000: null,
            currency: "INR"
          }
        }
      }
    });
    console.log("   Created requirement:", requirement.id);
  }

  console.log("6/7 Creating demo application + contract…");
  // Check if a contract already exists for this creator/requirement pair
  const existingApp = await db.application.findFirst({
    where: {
      requirementId: requirement.id,
      creatorId: creatorProfile.id
    },
    include: { contract: true }
  });

  let contractId: string;

  if (existingApp?.contract) {
    contractId = existingApp.contract.id;
    console.log("   Using existing contract:", contractId);

    // Ensure contract is ACTIVE
    await db.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.ACTIVE }
    });
  } else {
    // Create application
    const application = existingApp ?? await db.application.create({
      data: {
        requirementId: requirement.id,
        creatorId: creatorProfile.id,
        pitch: "Demo application for Meta App Review — auto-created by seed script.",
        status: ApplicationStatus.APPROVED,
        appliedAt: new Date(),
        decisionAt: new Date()
      }
    });

    // Create contract
    const contract = await db.contract.create({
      data: {
        requirementId: requirement.id,
        creatorId: creatorProfile.id,
        businessId: businessProfile.id,
        applicationId: application.id,
        status: ContractStatus.ACTIVE,
        acceptedAt: new Date(),
        termsSnapshotJson: {
          title: requirement.title,
          brief: requirement.brief,
          compensation: { fixedFeeAmount: "2500", currency: "INR" },
          deliverableCount: 1
        }
      }
    });
    contractId = contract.id;
    console.log("   Created contract:", contractId);

    // Update application status
    await db.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.APPROVED }
    });
  }

  console.log("7/7 Creating deliverable with demo Reel URL…");
  // Check for existing deliverable
  const existingDeliverable = await db.deliverable.findFirst({
    where: { contractId, fileType: "video" }
  });

  let deliverableId: string;
  if (existingDeliverable) {
    deliverableId = existingDeliverable.id;
    // Update with the demo reel URL
    await db.deliverable.update({
      where: { id: deliverableId },
      data: {
        externalUrl: DEMO_REEL_URL,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date()
      }
    });
    console.log("   Updated deliverable:", deliverableId, "with Reel URL");
  } else {
    const deliverable = await db.deliverable.create({
      data: {
        contractId,
        creatorId: creatorProfile.id,
        fileUrl: "",
        fileType: "video",
        contentSource: "CREATOR_URL",
        externalUrl: DEMO_REEL_URL,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date()
      }
    });
    deliverableId = deliverable.id;
    console.log("   Created deliverable:", deliverableId, "with Reel URL");
  }

  console.log("\n✅ Meta Review Demo Seed Complete!\n");
  console.log("=".repeat(60));
  console.log("DEMO CREATOR LOGIN:");
  console.log("  URL:      https://www.merex.in/login/creator");
  console.log("  Email:    " + CREATOR_EMAIL);
  console.log("  Password: " + CREATOR_PASSWORD);
  console.log("");
  console.log("IMPORTANT: After logging in via email/password, the creator");
  console.log("MUST connect their Instagram account via OAuth to demonstrate");
  console.log("instagram_business_basic and instagram_business_manage_insights.");
  console.log("Go to: https://www.merex.in/creator/profile → Connect Instagram");
  console.log("");
  console.log("CONTRACT ID (for the deals page demo):");
  console.log("  Contract: " + contractId);
  console.log("  Deal URL: https://www.merex.in/creator/deals/" + contractId);
  console.log("");
  console.log("DEMO REEL URL configured:");
  console.log("  " + DEMO_REEL_URL);
  console.log("  ⚠️  Replace REPLACE_WITH_REAL_REEL_ID with an actual Reel ID");
  console.log("  before running this script if not already done.");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

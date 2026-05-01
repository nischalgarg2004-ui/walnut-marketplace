-- PENDING enum value added in 20260419165959_add_deliverable_status_pending

-- AlterTable CreatorProfile
ALTER TABLE "CreatorProfile" ADD COLUMN "indiaStateId" TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN "indiaDistrictId" TEXT;

-- AlterTable RequirementEligibility
ALTER TABLE "RequirementEligibility" ADD COLUMN "allowedDistrictIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable Requirement
ALTER TABLE "Requirement" ADD COLUMN "deliverableSlots" JSONB;

-- AlterTable Application (shipping snapshot)
ALTER TABLE "Application" ADD COLUMN "shippingFullName" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingPhone" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingLine1" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingLine2" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingState" TEXT;
ALTER TABLE "Application" ADD COLUMN "shippingPincode" TEXT;
ALTER TABLE "Application" ADD COLUMN "addressSharedWithBrandAt" TIMESTAMP(3);

-- AlterTable Deliverable: slot metadata + pending workflow
ALTER TABLE "Deliverable" ADD COLUMN "expectedKind" "RequirementDeliverableKind";
ALTER TABLE "Deliverable" ADD COLUMN "slotIndex" INTEGER;

-- Allow unsubmitted deliverables (seeded placeholders)
ALTER TABLE "Deliverable" ALTER COLUMN "submittedAt" DROP NOT NULL;

-- Default new rows to PENDING until creator submits
ALTER TABLE "Deliverable" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"DeliverableStatus";

-- Existing rows remain SUBMITTED; ensure submittedAt exists for legacy
UPDATE "Deliverable" SET "submittedAt" = NOW() WHERE "submittedAt" IS NULL AND "status" <> 'PENDING';

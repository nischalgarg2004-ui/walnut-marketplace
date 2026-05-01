-- Enums for clipping foundation
CREATE TYPE "RequirementCategory" AS ENUM ('UGC', 'CLIPPING');
CREATE TYPE "CreatorPrimaryPersona" AS ENUM ('CREATOR', 'EDITOR_PAGE');
CREATE TYPE "ClippingLifecycleStatus" AS ENUM (
  'SOURCE_RECEIVED',
  'SAMPLE_SUBMITTED',
  'REVISION_REQUESTED',
  'APPROVED_FOR_PUBLISH',
  'PUBLISHED_ON_EDITOR_IG',
  'VERIFIED',
  'PAID'
);

-- Creator profile persona and clipping readiness
ALTER TABLE "CreatorProfile"
ADD COLUMN "primaryPersona" "CreatorPrimaryPersona" NOT NULL DEFAULT 'CREATOR',
ADD COLUMN "clippingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "editorPageHandle" TEXT,
ADD COLUMN "clippingCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Requirement category and clipping payload
ALTER TABLE "Requirement"
ADD COLUMN "category" "RequirementCategory" NOT NULL DEFAULT 'UGC',
ADD COLUMN "clippingMeta" JSONB;

-- Application-level clipping lifecycle and submissions
ALTER TABLE "Application"
ADD COLUMN "clippingLifecycleStatus" "ClippingLifecycleStatus",
ADD COLUMN "clippingDestinationHandle" TEXT,
ADD COLUMN "clippingSampleUrl" TEXT,
ADD COLUMN "clippingFinalUrl" TEXT,
ADD COLUMN "clippingVerifiedAt" TIMESTAMP(3);

-- Backfill safeguard for pre-existing rows
UPDATE "Requirement"
SET "category" = 'UGC'
WHERE "category" IS NULL;

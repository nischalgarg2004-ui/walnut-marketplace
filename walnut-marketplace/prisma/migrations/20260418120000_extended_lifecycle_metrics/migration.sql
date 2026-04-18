-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'WITHDRAWN';

-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
ALTER TYPE "DeliverableStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "DeliverableStatus" ADD VALUE 'UNDER_REVIEW';

-- AlterEnum
ALTER TYPE "DeliverableStatus" ADD VALUE 'PUBLISHED';

-- CreateEnum
CREATE TYPE "RequirementDeliverableKind" AS ENUM ('STORY', 'REEL', 'POST', 'MIXED');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('CREATOR_URL', 'INSTAGRAM_MEDIA', 'UPLOADED_FILE');

-- CreateEnum
CREATE TYPE "BarterShipmentStatus" AS ENUM ('PENDING', 'SHIPPED', 'RECEIVED');

-- AlterTable Requirement
ALTER TABLE "Requirement" ADD COLUMN "deliverableKind" "RequirementDeliverableKind",
ADD COLUMN "deliveryDueAt" TIMESTAMP(3),
ADD COLUMN "deliveryDueOffsetDays" INTEGER;

-- AlterTable Application
ALTER TABLE "Application" ADD COLUMN "termsVersion" TEXT,
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "barterConsentAt" TIMESTAMP(3),
ADD COLUMN "barterConsentVersion" TEXT;

-- AlterTable Contract
ALTER TABLE "Contract" ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "deliveryEtaAt" TIMESTAMP(3);

-- AlterTable CreatorProfile
ALTER TABLE "CreatorProfile" ADD COLUMN "instagramTokenExpiresAt" TIMESTAMP(3);

-- AlterTable Deliverable
ALTER TABLE "Deliverable" ALTER COLUMN "fileUrl" SET DEFAULT '';
ALTER TABLE "Deliverable" ADD COLUMN "contentSource" "ContentSource" NOT NULL DEFAULT 'UPLOADED_FILE',
ADD COLUMN "externalUrl" TEXT,
ADD COLUMN "instagramMediaId" TEXT;

-- CreateTable MetricSnapshot
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "rawJson" JSONB,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable BarterShipment
CREATE TABLE "BarterShipment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" "BarterShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "trackingHint" TEXT,
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "acknowledgedByUserId" TEXT,

    CONSTRAINT "BarterShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable ConsentRecord
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payloadHash" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetricSnapshot_contractId_capturedAt_idx" ON "MetricSnapshot"("contractId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BarterShipment_contractId_key" ON "BarterShipment"("contractId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_entityType_entityId_idx" ON "ConsentRecord"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarterShipment" ADD CONSTRAINT "BarterShipment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

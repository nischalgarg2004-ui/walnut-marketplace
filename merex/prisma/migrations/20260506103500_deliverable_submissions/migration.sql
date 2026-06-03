-- CreateEnum
CREATE TYPE "DeliverableSubmissionStage" AS ENUM ('DRAFT', 'PUBLISHED_LINK');

-- CreateEnum
CREATE TYPE "DeliverableSubmissionStatus" AS ENUM ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED');

-- CreateTable
CREATE TABLE "DeliverableSubmission" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "stage" "DeliverableSubmissionStage" NOT NULL,
    "status" "DeliverableSubmissionStatus" NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "feedback" TEXT,
    "submittedBy" "UserRole" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DeliverableSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverableSubmission_deliverableId_stage_submittedAt_idx" ON "DeliverableSubmission"("deliverableId", "stage", "submittedAt");

-- AddForeignKey
ALTER TABLE "DeliverableSubmission" ADD CONSTRAINT "DeliverableSubmission_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;


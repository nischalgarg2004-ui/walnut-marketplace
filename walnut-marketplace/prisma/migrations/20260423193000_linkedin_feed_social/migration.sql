-- Alter Requirement with hybrid post presentation fields
ALTER TABLE "Requirement"
ADD COLUMN "postText" TEXT,
ADD COLUMN "postImageUrl" TEXT,
ADD COLUMN "postPublishedAt" TIMESTAMP(3);

-- Create enum for reactions
CREATE TYPE "RequirementReactionType" AS ENUM ('LIKE');

-- Persistent requirement reactions
CREATE TABLE "RequirementReaction" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "RequirementReactionType" NOT NULL DEFAULT 'LIKE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RequirementReaction_pkey" PRIMARY KEY ("id")
);

-- Persistent requirement comments
CREATE TABLE "RequirementComment" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RequirementComment_pkey" PRIMARY KEY ("id")
);

-- Persistent requirement share events
CREATE TABLE "RequirementShareEvent" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequirementShareEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RequirementReaction_requirementId_userId_key"
ON "RequirementReaction"("requirementId", "userId");

CREATE INDEX "RequirementReaction_requirementId_createdAt_idx"
ON "RequirementReaction"("requirementId", "createdAt");
CREATE INDEX "RequirementReaction_userId_createdAt_idx"
ON "RequirementReaction"("userId", "createdAt");

CREATE INDEX "RequirementComment_requirementId_createdAt_idx"
ON "RequirementComment"("requirementId", "createdAt");
CREATE INDEX "RequirementComment_userId_createdAt_idx"
ON "RequirementComment"("userId", "createdAt");

CREATE INDEX "RequirementShareEvent_requirementId_createdAt_idx"
ON "RequirementShareEvent"("requirementId", "createdAt");
CREATE INDEX "RequirementShareEvent_userId_createdAt_idx"
ON "RequirementShareEvent"("userId", "createdAt");

ALTER TABLE "RequirementReaction"
ADD CONSTRAINT "RequirementReaction_requirementId_fkey"
FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementReaction"
ADD CONSTRAINT "RequirementReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequirementComment"
ADD CONSTRAINT "RequirementComment_requirementId_fkey"
FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementComment"
ADD CONSTRAINT "RequirementComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequirementShareEvent"
ADD CONSTRAINT "RequirementShareEvent_requirementId_fkey"
FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementShareEvent"
ADD CONSTRAINT "RequirementShareEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

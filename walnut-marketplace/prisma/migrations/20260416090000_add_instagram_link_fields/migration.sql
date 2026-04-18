-- CreateEnum
CREATE TYPE "InstagramAccountType" AS ENUM ('CREATOR', 'BUSINESS');

-- AlterTable
ALTER TABLE "CreatorProfile"
ADD COLUMN "instagramUserId" TEXT,
ADD COLUMN "instagramUsername" TEXT,
ADD COLUMN "instagramAccountType" "InstagramAccountType",
ADD COLUMN "instagramConnectedAt" TIMESTAMP(3),
ADD COLUMN "instagramAccessTokenEncrypted" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_instagramUserId_key" ON "CreatorProfile"("instagramUserId");

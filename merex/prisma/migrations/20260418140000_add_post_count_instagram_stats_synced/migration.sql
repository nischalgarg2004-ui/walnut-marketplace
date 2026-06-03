-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "postCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instagramStatsSyncedAt" TIMESTAMP(3);

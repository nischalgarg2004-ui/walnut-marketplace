-- Add persisted Instagram total views aggregate for creator profiles.
ALTER TABLE "CreatorProfile"
ADD COLUMN "instagramViewsTotal" INTEGER NOT NULL DEFAULT 0;

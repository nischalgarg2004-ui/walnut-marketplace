-- Track Meta / Instagram deauthorize and data-deletion webhook requests.
CREATE TABLE "MetaPlatformRequest" (
    "id" TEXT NOT NULL,
    "confirmationCode" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MetaPlatformRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MetaPlatformRequest_confirmationCode_key" ON "MetaPlatformRequest"("confirmationCode");
CREATE INDEX "MetaPlatformRequest_instagramUserId_idx" ON "MetaPlatformRequest"("instagramUserId");
CREATE INDEX "MetaPlatformRequest_kind_status_idx" ON "MetaPlatformRequest"("kind", "status");

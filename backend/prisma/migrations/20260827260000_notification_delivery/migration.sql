CREATE TABLE IF NOT EXISTS "NotificationEvent" (
 "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "eventType" TEXT NOT NULL,
 "aggregateType" TEXT, "aggregateId" TEXT, "payload" JSONB NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'QUEUED',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3), CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
 "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "eventId" UUID NOT NULL,
 "recipientId" UUID NOT NULL, "channel" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
 "providerReference" TEXT, "attempts" INTEGER NOT NULL DEFAULT 0, "lastError" TEXT, "sentAt" TIMESTAMP(3),
 "deliveredAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
 "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "userId" UUID NOT NULL,
 "channel" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "quietHours" JSONB, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "NotificationEvent_tenantId_schoolId_status_createdAt_idx" ON "NotificationEvent"("tenantId", "schoolId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_tenantId_schoolId_recipientId_status_idx" ON "NotificationDelivery"("tenantId", "schoolId", "recipientId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_tenantId_schoolId_userId_channel_key" ON "NotificationPreference"("tenantId", "schoolId", "userId", "channel");

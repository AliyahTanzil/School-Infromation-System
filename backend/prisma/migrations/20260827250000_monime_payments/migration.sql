CREATE TABLE IF NOT EXISTS "PaymentIntent" (
 "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "invoiceId" UUID NOT NULL, "studentId" UUID NOT NULL,
 "providerId" TEXT, "internalReference" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "amountMinor" INTEGER NOT NULL,
 "currency" TEXT NOT NULL, "channel" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'CREATED', "description" TEXT,
 "metadata" JSONB NOT NULL DEFAULT '{}', "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "PaymentAttempt" (
 "id" UUID NOT NULL, "intentId" UUID NOT NULL, "attemptNumber" INTEGER NOT NULL, "externalReference" TEXT,
 "providerStatus" TEXT, "status" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "GatewayWebhookEvent" (
 "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "providerId" TEXT NOT NULL,
 "eventId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "signatureValid" BOOLEAN NOT NULL, "processedAt" TIMESTAMP(3),
 "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GatewayWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_internalReference_key" ON "PaymentIntent"("internalReference");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentIntent_tenantId_schoolId_invoiceId_status_idx" ON "PaymentIntent"("tenantId", "schoolId", "invoiceId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_intentId_attemptNumber_key" ON "PaymentAttempt"("intentId", "attemptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "GatewayWebhookEvent_providerId_eventId_key" ON "GatewayWebhookEvent"("providerId", "eventId");
CREATE INDEX IF NOT EXISTS "GatewayWebhookEvent_tenantId_schoolId_processedAt_idx" ON "GatewayWebhookEvent"("tenantId", "schoolId", "processedAt");

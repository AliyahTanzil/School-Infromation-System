CREATE TABLE IF NOT EXISTS "Fee" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "name" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'SLE', "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "studentId" UUID NOT NULL,
  "feeId" UUID, "invoiceNumber" TEXT NOT NULL, "subtotal" DECIMAL(12,2) NOT NULL,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0, "total" DECIMAL(12,2) NOT NULL,
  "balance" DECIMAL(12,2) NOT NULL, "status" TEXT NOT NULL DEFAULT 'ISSUED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "invoiceId" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL, "provider" TEXT NOT NULL, "reference" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "studentId" UUID,
  "invoiceId" UUID, "paymentId" UUID, "type" TEXT NOT NULL, "amountMinor" INTEGER NOT NULL,
  "reference" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Fee_tenantId_schoolId_active_idx" ON "Fee"("tenantId", "schoolId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_tenantId_schoolId_invoiceNumber_key" ON "Invoice"("tenantId", "schoolId", "invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_schoolId_studentId_status_idx" ON "Invoice"("tenantId", "schoolId", "studentId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_tenantId_schoolId_invoiceId_status_idx" ON "Payment"("tenantId", "schoolId", "invoiceId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialTransaction_reference_key" ON "FinancialTransaction"("reference");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_tenantId_schoolId_createdAt_idx" ON "FinancialTransaction"("tenantId", "schoolId", "createdAt");

CREATE TABLE IF NOT EXISTS "Result" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "examinationId" UUID NOT NULL, "studentId" UUID NOT NULL, "schemeId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REVIEW', "studentStatus" TEXT NOT NULL,
  "total" DECIMAL(8,2) NOT NULL DEFAULT 0, "average" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "grade" TEXT, "gradePoint" DECIMAL(5,2), "position" INTEGER,
  "processedAt" TIMESTAMP(3), "publishedAt" TIMESTAMP(3), "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ResultAudit" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "resultId" UUID NOT NULL, "actorId" UUID, "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResultAudit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Result_examinationId_studentId_key" ON "Result"("examinationId", "studentId");
CREATE INDEX IF NOT EXISTS "Result_tenantId_schoolId_examinationId_status_idx" ON "Result"("tenantId", "schoolId", "examinationId", "status");
CREATE INDEX IF NOT EXISTS "ResultAudit_tenantId_schoolId_resultId_createdAt_idx" ON "ResultAudit"("tenantId", "schoolId", "resultId", "createdAt");

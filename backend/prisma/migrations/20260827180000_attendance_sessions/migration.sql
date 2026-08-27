ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'HALF_DAY';
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'ARCHIVED');
CREATE TYPE "AttendanceCaptureMethod" AS ENUM ('MANUAL', 'BIOMETRIC', 'QR_CODE', 'IMPORT');

CREATE TABLE "AttendanceSession" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "classId" UUID NOT NULL, "periodId" UUID, "sessionDate" DATE NOT NULL,
  "title" TEXT NOT NULL, "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" UUID, "openedAt" TIMESTAMP(3), "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AttendanceSession_classId_sessionDate_periodId_key" ON "AttendanceSession"("classId", "sessionDate", "periodId");
CREATE INDEX "AttendanceSession_tenantId_schoolId_sessionDate_status_idx" ON "AttendanceSession"("tenantId", "schoolId", "sessionDate", "status");

CREATE TABLE "AttendanceAudit" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "sessionId" UUID NOT NULL, "actorId" UUID, "action" TEXT NOT NULL,
  "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AttendanceAudit_tenantId_schoolId_sessionId_createdAt_idx" ON "AttendanceAudit"("tenantId", "schoolId", "sessionId", "createdAt");

ALTER TABLE "AttendanceRecord" ALTER COLUMN "attendanceDate" DROP NOT NULL;
ALTER TABLE "AttendanceRecord" ADD COLUMN "schoolId" UUID;
ALTER TABLE "AttendanceRecord" ADD COLUMN "sessionId" UUID;
ALTER TABLE "AttendanceRecord" ADD COLUMN "method" "AttendanceCaptureMethod" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "AttendanceRecord" ADD COLUMN "markedById" UUID;
ALTER TABLE "AttendanceRecord" ADD COLUMN "markedAt" TIMESTAMP(3);
ALTER TABLE "AttendanceRecord" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");
CREATE INDEX "AttendanceRecord_tenantId_schoolId_sessionId_idx" ON "AttendanceRecord"("tenantId", "schoolId", "sessionId");

ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceAudit" ADD CONSTRAINT "AttendanceAudit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceAudit" ADD CONSTRAINT "AttendanceAudit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceAudit" ADD CONSTRAINT "AttendanceAudit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Examination" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "name" TEXT NOT NULL, "code" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" UUID, "lockedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Examination_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ExaminationCandidate" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "examinationId" UUID NOT NULL, "studentId" UUID NOT NULL, "classId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExaminationCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ExaminationSchedule" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "examinationId" UUID NOT NULL, "subjectCode" TEXT NOT NULL, "classId" UUID,
  "scheduledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExaminationSchedule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ExaminationMark" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "examinationId" UUID NOT NULL, "candidateId" UUID NOT NULL, "subjectCode" TEXT NOT NULL,
  "marks" DECIMAL(5,2) NOT NULL, "recordedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExaminationMark_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ExaminationAudit" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "examinationId" UUID NOT NULL, "actorId" UUID, "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExaminationAudit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Examination_tenantId_schoolId_code_key" ON "Examination"("tenantId", "schoolId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "ExaminationCandidate_examinationId_studentId_key" ON "ExaminationCandidate"("examinationId", "studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExaminationSchedule_examinationId_subjectCode_classId_key" ON "ExaminationSchedule"("examinationId", "subjectCode", "classId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExaminationMark_examinationId_candidateId_subjectCode_key" ON "ExaminationMark"("examinationId", "candidateId", "subjectCode");

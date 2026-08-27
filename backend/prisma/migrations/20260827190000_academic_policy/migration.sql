CREATE TYPE "AcademicPolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "GradeScheme" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "name" TEXT NOT NULL, "code" TEXT NOT NULL, "passMark" DOUBLE PRECISION NOT NULL,
  "status" "AcademicPolicyStatus" NOT NULL DEFAULT 'DRAFT', "effectiveFrom" DATE NOT NULL,
  "effectiveTo" DATE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3), CONSTRAINT "GradeScheme_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GradeBand" (
  "id" UUID NOT NULL, "schemeId" UUID NOT NULL, "label" TEXT NOT NULL,
  "minMark" DOUBLE PRECISION NOT NULL, "maxMark" DOUBLE PRECISION NOT NULL,
  "point" DOUBLE PRECISION NOT NULL, "remark" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessmentWeight" (
  "id" UUID NOT NULL, "schemeId" UUID NOT NULL, "subjectId" UUID,
  "name" TEXT NOT NULL, "code" TEXT NOT NULL, "weight" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "AssessmentWeight_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GradeSchemeHistory" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "schemeId" UUID NOT NULL, "actorId" UUID, "fromStatus" "AcademicPolicyStatus" NOT NULL,
  "toStatus" "AcademicPolicyStatus" NOT NULL, "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GradeSchemeHistory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GradeScheme_tenantId_schoolId_code_key" ON "GradeScheme"("tenantId", "schoolId", "code");
CREATE INDEX "GradeScheme_tenantId_schoolId_status_effectiveFrom_idx" ON "GradeScheme"("tenantId", "schoolId", "status", "effectiveFrom");
CREATE UNIQUE INDEX "GradeBand_schemeId_label_key" ON "GradeBand"("schemeId", "label");
CREATE INDEX "GradeBand_schemeId_sortOrder_idx" ON "GradeBand"("schemeId", "sortOrder");
CREATE UNIQUE INDEX "AssessmentWeight_schemeId_subjectId_code_key" ON "AssessmentWeight"("schemeId", "subjectId", "code");
CREATE INDEX "AssessmentWeight_schemeId_subjectId_idx" ON "AssessmentWeight"("schemeId", "subjectId");
CREATE INDEX "GradeSchemeHistory_tenantId_schoolId_schemeId_createdAt_idx" ON "GradeSchemeHistory"("tenantId", "schoolId", "schemeId", "createdAt");
ALTER TABLE "GradeScheme" ADD CONSTRAINT "GradeScheme_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeScheme" ADD CONSTRAINT "GradeScheme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GradeScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentWeight" ADD CONSTRAINT "AssessmentWeight_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GradeScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentWeight" ADD CONSTRAINT "AssessmentWeight_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeSchemeHistory" ADD CONSTRAINT "GradeSchemeHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeSchemeHistory" ADD CONSTRAINT "GradeSchemeHistory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeSchemeHistory" ADD CONSTRAINT "GradeSchemeHistory_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GradeScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

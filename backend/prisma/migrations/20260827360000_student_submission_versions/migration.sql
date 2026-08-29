CREATE TABLE IF NOT EXISTS "StudentSubmission" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "assignmentId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubmissionVersion" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "submissionId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "attachments" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentSubmission_tenantId_schoolId_assignmentId_studentId_key"
  ON "StudentSubmission"("tenantId", "schoolId", "assignmentId", "studentId");
CREATE INDEX IF NOT EXISTS "StudentSubmission_tenantId_schoolId_studentId_status_idx"
  ON "StudentSubmission"("tenantId", "schoolId", "studentId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "SubmissionVersion_submissionId_version_key"
  ON "SubmissionVersion"("submissionId", "version");
CREATE INDEX IF NOT EXISTS "SubmissionVersion_tenantId_schoolId_submissionId_createdAt_idx"
  ON "SubmissionVersion"("tenantId", "schoolId", "submissionId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "StudentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

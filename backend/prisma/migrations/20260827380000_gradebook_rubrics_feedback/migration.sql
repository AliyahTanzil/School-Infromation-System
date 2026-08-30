CREATE TABLE "Rubric" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL, "authorId" UUID NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RubricCriterion" (
  "id" UUID NOT NULL, "rubricId" UUID NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "maxPoints" INTEGER NOT NULL, "position" INTEGER NOT NULL,
  CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SubmissionGrade" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "submissionId" UUID NOT NULL, "graderId" UUID NOT NULL, "score" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "summary" TEXT,
  "releasedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubmissionGrade_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RubricScore" (
  "gradeId" UUID NOT NULL, "criterionId" UUID NOT NULL, "points" INTEGER NOT NULL,
  "comment" TEXT, CONSTRAINT "RubricScore_pkey" PRIMARY KEY ("gradeId", "criterionId")
);
CREATE TABLE "GradeFeedback" (
  "id" UUID NOT NULL, "gradeId" UUID NOT NULL, "authorId" UUID NOT NULL,
  "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GradeFeedback_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Assignment" ADD COLUMN "rubricId" UUID;
CREATE UNIQUE INDEX "RubricCriterion_rubricId_position_key" ON "RubricCriterion"("rubricId", "position");
CREATE UNIQUE INDEX "SubmissionGrade_submissionId_key" ON "SubmissionGrade"("submissionId");
CREATE INDEX "Rubric_tenantId_schoolId_classroomId_status_idx" ON "Rubric"("tenantId", "schoolId", "classroomId", "status");
CREATE INDEX "SubmissionGrade_tenantId_schoolId_status_updatedAt_idx" ON "SubmissionGrade"("tenantId", "schoolId", "status", "updatedAt");
CREATE INDEX "GradeFeedback_gradeId_createdAt_idx" ON "GradeFeedback"("gradeId", "createdAt");
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubmissionGrade" ADD CONSTRAINT "SubmissionGrade_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "StudentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubmissionGrade" ADD CONSTRAINT "SubmissionGrade_graderId_fkey" FOREIGN KEY ("graderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SubmissionGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RubricScore" ADD CONSTRAINT "RubricScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GradeFeedback" ADD CONSTRAINT "GradeFeedback_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SubmissionGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GradeFeedback" ADD CONSTRAINT "GradeFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

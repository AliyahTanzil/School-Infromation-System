CREATE TABLE "Assignment" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classroomId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "subjectId" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "topic" TEXT,
  "type" TEXT NOT NULL DEFAULT 'ASSIGNMENT',
  "dueAt" TIMESTAMP(3),
  "points" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "availableAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assignment_tenantId_schoolId_classroomId_status_dueAt_idx" ON "Assignment"("tenantId", "schoolId", "classroomId", "status", "dueAt");
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

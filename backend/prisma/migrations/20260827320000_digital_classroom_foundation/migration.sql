CREATE TABLE "DigitalClassroom" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classId" UUID,
  "academicTermId" UUID,
  "ownerId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "DigitalClassroom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DigitalClassroomMember" (
  "classroomId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removedAt" TIMESTAMP(3),
  CONSTRAINT "DigitalClassroomMember_pkey" PRIMARY KEY ("classroomId", "userId")
);

CREATE UNIQUE INDEX "DigitalClassroom_tenantId_schoolId_code_key"
  ON "DigitalClassroom"("tenantId", "schoolId", "code");
CREATE INDEX "DigitalClassroom_tenantId_schoolId_status_createdAt_idx"
  ON "DigitalClassroom"("tenantId", "schoolId", "status", "createdAt");
CREATE INDEX "DigitalClassroom_tenantId_schoolId_classId_idx"
  ON "DigitalClassroom"("tenantId", "schoolId", "classId");
CREATE INDEX "DigitalClassroomMember_tenantId_schoolId_userId_status_idx"
  ON "DigitalClassroomMember"("tenantId", "schoolId", "userId", "status");

ALTER TABLE "DigitalClassroomMember"
  ADD CONSTRAINT "DigitalClassroomMember_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "DigitalClassroom"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DigitalClassroom" ADD CONSTRAINT "DigitalClassroom_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroom" ADD CONSTRAINT "DigitalClassroom_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroom" ADD CONSTRAINT "DigitalClassroom_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroom" ADD CONSTRAINT "DigitalClassroom_academicTermId_fkey"
  FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroom" ADD CONSTRAINT "DigitalClassroom_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroomMember" ADD CONSTRAINT "DigitalClassroomMember_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroomMember" ADD CONSTRAINT "DigitalClassroomMember_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalClassroomMember" ADD CONSTRAINT "DigitalClassroomMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

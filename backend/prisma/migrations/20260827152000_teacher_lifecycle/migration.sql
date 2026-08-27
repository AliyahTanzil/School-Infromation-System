CREATE TYPE "TeacherStatus" AS ENUM ('APPLICANT', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED');

CREATE TABLE "Teacher" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "userId" UUID,
  "employeeNumber" TEXT NOT NULL,
  "status" "TeacherStatus" NOT NULL DEFAULT 'APPLICANT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
CREATE UNIQUE INDEX "Teacher_tenantId_employeeNumber_key" ON "Teacher"("tenantId", "employeeNumber");
CREATE INDEX "Teacher_tenantId_schoolId_status_idx" ON "Teacher"("tenantId", "schoolId", "status");

CREATE TABLE "TeacherProfile" ("teacherId" UUID NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "email" TEXT, "phone" TEXT, CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("teacherId"));
CREATE TABLE "TeacherEmployment" ("teacherId" UUID NOT NULL, "jobTitle" TEXT NOT NULL, "employmentType" TEXT NOT NULL, "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3), CONSTRAINT "TeacherEmployment_pkey" PRIMARY KEY ("teacherId"));
CREATE TABLE "TeacherQualification" ("id" UUID NOT NULL, "teacherId" UUID NOT NULL, "title" TEXT NOT NULL, "institution" TEXT, "awardedOn" TIMESTAMP(3), CONSTRAINT "TeacherQualification_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TeacherQualification_teacherId_idx" ON "TeacherQualification"("teacherId");
CREATE TABLE "TeacherCertification" ("id" UUID NOT NULL, "teacherId" UUID NOT NULL, "name" TEXT NOT NULL, "issuer" TEXT, "expiresOn" TIMESTAMP(3), CONSTRAINT "TeacherCertification_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TeacherCertification_teacherId_idx" ON "TeacherCertification"("teacherId");
CREATE TABLE "TeacherDepartment" ("id" UUID NOT NULL, "teacherId" UUID NOT NULL, "department" TEXT NOT NULL, "isPrimary" BOOLEAN NOT NULL DEFAULT false, CONSTRAINT "TeacherDepartment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "TeacherDepartment_teacherId_department_key" ON "TeacherDepartment"("teacherId", "department");
CREATE TABLE "TeacherAvailability" ("id" UUID NOT NULL, "teacherId" UUID NOT NULL, "dayOfWeek" INTEGER NOT NULL, "startsAt" TEXT NOT NULL, "endsAt" TEXT NOT NULL, CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TeacherAvailability_teacherId_dayOfWeek_idx" ON "TeacherAvailability"("teacherId", "dayOfWeek");
CREATE TABLE "TeacherHistory" ("id" UUID NOT NULL, "teacherId" UUID NOT NULL, "fromStatus" "TeacherStatus" NOT NULL, "toStatus" "TeacherStatus" NOT NULL, "reason" TEXT, "actorId" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TeacherHistory_pkey" PRIMARY KEY ("id"));
CREATE INDEX "TeacherHistory_teacherId_createdAt_idx" ON "TeacherHistory"("teacherId", "createdAt");

ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherEmployment" ADD CONSTRAINT "TeacherEmployment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherQualification" ADD CONSTRAINT "TeacherQualification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherCertification" ADD CONSTRAINT "TeacherCertification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherDepartment" ADD CONSTRAINT "TeacherDepartment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherHistory" ADD CONSTRAINT "TeacherHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

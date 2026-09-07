CREATE TABLE "AcademicCalendarEvent" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicCalendarEvent_tenantId_schoolId_code_key"
ON "AcademicCalendarEvent"("tenantId", "schoolId", "code");

CREATE INDEX "AcademicCalendarEvent_tenantId_schoolId_type_startsAt_idx"
ON "AcademicCalendarEvent"("tenantId", "schoolId", "type", "startsAt");

ALTER TABLE "AcademicCalendarEvent"
ADD CONSTRAINT "AcademicCalendarEvent_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicCalendarEvent"
ADD CONSTRAINT "AcademicCalendarEvent_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicTerm" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PLANNED';

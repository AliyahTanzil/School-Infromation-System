CREATE TABLE IF NOT EXISTS "Timetable" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "academicPeriodId" UUID NOT NULL, "name" TEXT NOT NULL, "academicYear" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "version" INTEGER NOT NULL DEFAULT 1,
  "publishedAt" TIMESTAMP(3), "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "TimetableSlot" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL, "timetableId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL, "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL,
  "label" TEXT NOT NULL, "isBreak" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ScheduleEntry" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "timetableId" UUID NOT NULL, "timeSlotId" UUID NOT NULL, "classId" UUID,
  "teacherId" UUID, "classroomId" UUID, "subjectCode" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'LESSON', "duration" INTEGER NOT NULL DEFAULT 1, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "SchedulingConflict" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "timetableId" UUID NOT NULL, "entryId" UUID NOT NULL, "code" TEXT NOT NULL,
  "severity" TEXT NOT NULL, "message" TEXT NOT NULL, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchedulingConflict_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "TimetableVersion" (
  "id" UUID NOT NULL, "timetableId" UUID NOT NULL, "number" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL, "createdBy" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimetableVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "TimetableAudit" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "timetableId" UUID NOT NULL, "actorId" UUID, "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimetableAudit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ScheduleSubstitution" (
  "id" UUID NOT NULL, "tenantId" UUID NOT NULL, "schoolId" UUID NOT NULL,
  "timetableId" UUID NOT NULL, "entryId" UUID NOT NULL, "originalTeacherId" UUID,
  "substituteTeacherId" UUID, "reason" TEXT NOT NULL, "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL, "createdBy" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleSubstitution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Timetable_tenantId_schoolId_updatedAt_idx" ON "Timetable"("tenantId", "schoolId", "updatedAt");
CREATE INDEX IF NOT EXISTS "TimetableSlot_timetableId_weekday_startTime_idx" ON "TimetableSlot"("timetableId", "weekday", "startTime");
CREATE INDEX IF NOT EXISTS "ScheduleEntry_timetableId_timeSlotId_idx" ON "ScheduleEntry"("timetableId", "timeSlotId");
CREATE INDEX IF NOT EXISTS "SchedulingConflict_timetableId_severity_resolvedAt_idx" ON "SchedulingConflict"("timetableId", "severity", "resolvedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TimetableVersion_timetableId_number_key" ON "TimetableVersion"("timetableId", "number");
CREATE INDEX IF NOT EXISTS "TimetableAudit_timetableId_createdAt_idx" ON "TimetableAudit"("timetableId", "createdAt");
CREATE INDEX IF NOT EXISTS "ScheduleSubstitution_timetableId_startsAt_endsAt_idx" ON "ScheduleSubstitution"("timetableId", "startsAt", "endsAt");

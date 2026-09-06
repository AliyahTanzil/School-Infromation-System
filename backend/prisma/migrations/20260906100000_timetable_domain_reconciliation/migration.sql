-- Timetable domain reconciliation.
-- Additive only: preserves existing timetable rows and legacy subjectCode/academicYear fields.

CREATE TABLE IF NOT EXISTS "TimetableSettings" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "workingDays" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
  "schoolStartsAt" TEXT NOT NULL DEFAULT '08:00',
  "schoolEndsAt" TEXT NOT NULL DEFAULT '16:00',
  "lessonDurationMinutes" INTEGER NOT NULL DEFAULT 60,
  "breakStartsAt" TEXT,
  "breakEndsAt" TEXT,
  "lunchStartsAt" TEXT,
  "lunchEndsAt" TEXT,
  "maxPeriodsPerDay" INTEGER NOT NULL DEFAULT 8,
  "maxTeacherPeriodsDay" INTEGER NOT NULL DEFAULT 6,
  "maxTeacherPeriodsWeek" INTEGER NOT NULL DEFAULT 30,
  "maxConsecutivePeriods" INTEGER NOT NULL DEFAULT 3,
  "allowDoublePeriods" BOOLEAN NOT NULL DEFAULT false,
  "allowSaturday" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimetableSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TimetableRoom" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'CLASSROOM',
  "capacity" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "resources" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimetableRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeacherTeachingAssignment" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "teacherId" UUID NOT NULL,
  "subjectId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "termId" UUID NOT NULL,
  "periodsPerWeek" INTEGER NOT NULL DEFAULT 1,
  "maxPeriodsDay" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherTeachingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubjectPeriodRequirement" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "subjectId" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "termId" UUID NOT NULL,
  "periodsPerWeek" INTEGER NOT NULL,
  "minimumPeriods" INTEGER NOT NULL DEFAULT 0,
  "maximumPeriods" INTEGER,
  "preferredPeriodsDay" INTEGER NOT NULL DEFAULT 1,
  "requiresDoublePeriod" BOOLEAN NOT NULL DEFAULT false,
  "requiresLaboratory" BOOLEAN NOT NULL DEFAULT false,
  "streamRestriction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubjectPeriodRequirement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TeacherAvailability"
  ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Timetable"
  ADD COLUMN IF NOT EXISTS "academicYearId" UUID;

ALTER TABLE "ScheduleEntry"
  ADD COLUMN IF NOT EXISTS "subjectId" UUID,
  ADD COLUMN IF NOT EXISTS "roomId" UUID,
  ADD COLUMN IF NOT EXISTS "teachingAssignmentId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "TimetableSettings_tenantId_schoolId_key"
  ON "TimetableSettings"("tenantId", "schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "TimetableRoom_tenantId_schoolId_code_key"
  ON "TimetableRoom"("tenantId", "schoolId", "code");
CREATE INDEX IF NOT EXISTS "TimetableRoom_tenantId_schoolId_kind_isActive_idx"
  ON "TimetableRoom"("tenantId", "schoolId", "kind", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherTeachingAssignment_scope_key"
  ON "TeacherTeachingAssignment"("tenantId", "schoolId", "teacherId", "subjectId", "classId", "academicYearId", "termId");
CREATE INDEX IF NOT EXISTS "TeacherTeachingAssignment_teacher_scope_idx"
  ON "TeacherTeachingAssignment"("tenantId", "schoolId", "teacherId", "academicYearId", "termId", "status");
CREATE INDEX IF NOT EXISTS "TeacherTeachingAssignment_class_subject_idx"
  ON "TeacherTeachingAssignment"("tenantId", "schoolId", "classId", "subjectId", "academicYearId", "termId");
CREATE UNIQUE INDEX IF NOT EXISTS "SubjectPeriodRequirement_scope_key"
  ON "SubjectPeriodRequirement"("tenantId", "schoolId", "classId", "subjectId", "academicYearId", "termId");
CREATE INDEX IF NOT EXISTS "SubjectPeriodRequirement_scope_idx"
  ON "SubjectPeriodRequirement"("tenantId", "schoolId", "academicYearId", "termId", "classId");
CREATE INDEX IF NOT EXISTS "TeacherAvailability_scope_idx"
  ON "TeacherAvailability"("teacherId", "dayOfWeek", "kind", "startsAt");
CREATE INDEX IF NOT EXISTS "ScheduleEntry_teacher_slot_idx"
  ON "ScheduleEntry"("tenantId", "schoolId", "teacherId", "timeSlotId");
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleEntry_class_slot_key"
  ON "ScheduleEntry"("timetableId", "timeSlotId", "classId")
  WHERE "classId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleEntry_teacher_slot_key"
  ON "ScheduleEntry"("timetableId", "timeSlotId", "teacherId")
  WHERE "teacherId" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableSettings_tenantId_fkey') THEN
    ALTER TABLE "TimetableSettings" ADD CONSTRAINT "TimetableSettings_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableSettings_schoolId_fkey') THEN
    ALTER TABLE "TimetableSettings" ADD CONSTRAINT "TimetableSettings_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableRoom_tenantId_fkey') THEN
    ALTER TABLE "TimetableRoom" ADD CONSTRAINT "TimetableRoom_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableRoom_schoolId_fkey') THEN
    ALTER TABLE "TimetableRoom" ADD CONSTRAINT "TimetableRoom_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_tenantId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_schoolId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_teacherId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_subjectId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_classId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_academicYearId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_academicYearId_fkey"
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherTeachingAssignment_termId_fkey') THEN
    ALTER TABLE "TeacherTeachingAssignment" ADD CONSTRAINT "TeacherTeachingAssignment_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_tenantId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_schoolId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_classId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_subjectId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_academicYearId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_academicYearId_fkey"
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectPeriodRequirement_termId_fkey') THEN
    ALTER TABLE "SubjectPeriodRequirement" ADD CONSTRAINT "SubjectPeriodRequirement_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Timetable_academicPeriodId_fkey') THEN
    ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_academicPeriodId_fkey"
      FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Timetable_academicYearId_fkey') THEN
    ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_academicYearId_fkey"
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableSlot_timetableId_fkey') THEN
    ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_timetableId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_timeSlotId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_timeSlotId_fkey"
      FOREIGN KEY ("timeSlotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_classId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_teacherId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_subjectId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_roomId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "TimetableRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleEntry_teachingAssignmentId_fkey') THEN
    ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_teachingAssignmentId_fkey"
      FOREIGN KEY ("teachingAssignmentId") REFERENCES "TeacherTeachingAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SchedulingConflict_timetableId_fkey') THEN
    ALTER TABLE "SchedulingConflict" ADD CONSTRAINT "SchedulingConflict_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableVersion_timetableId_fkey') THEN
    ALTER TABLE "TimetableVersion" ADD CONSTRAINT "TimetableVersion_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimetableAudit_timetableId_fkey') THEN
    ALTER TABLE "TimetableAudit" ADD CONSTRAINT "TimetableAudit_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleSubstitution_timetableId_fkey') THEN
    ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_timetableId_fkey"
      FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

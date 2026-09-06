import { z } from 'zod';

const entry = z.object({
  roomId: z.string().uuid().optional(),
  timeSlotId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  classroomId: z.string().uuid().optional(),
  subjectCode: z.string().min(1).max(60),
  kind: z.enum(['LESSON', 'BREAK', 'FREE', 'DOUBLE', 'PRACTICAL', 'LABORATORY']).default('LESSON'),
  duration: z.number().int().positive().max(8).default(1),
  notes: z.string().max(500).optional(),
});

export const timetableRoomBody = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(40),
  kind: z.enum(['CLASSROOM', 'LABORATORY', 'RESOURCE']).default('CLASSROOM'),
  capacity: z.number().int().positive().max(10000),
  isActive: z.boolean().default(true),
  resources: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
});
export const timetableRoomSchema = z.object({ body: timetableRoomBody });
export const timetableRoomUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: timetableRoomBody
    .partial()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field'),
});

export const createTimetableSchema = z.object({
  body: z.object({
    academicPeriodId: z.string().uuid(),
    name: z.string().min(2).max(160),
    academicYear: z.string().min(4).max(40),
    slots: z
      .array(
        z.object({
          weekday: z.number().int().min(1).max(7),
          startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          label: z.string().max(80),
          isBreak: z.boolean().optional(),
        })
      )
      .min(1),
  }),
});

const idParams = z.object({ id: z.string().uuid() });
export const entrySchema = z.object({ params: idParams, body: entry });
export const statusSchema = z.object({
  params: idParams,
  body: z.object({ status: z.enum(['REVIEW', 'PUBLISHED', 'LOCKED', 'ARCHIVED']) }),
});
export const substitutionSchema = z.object({
  params: idParams,
  body: z.object({
    entryId: z.string().uuid(),
    originalTeacherId: z.string().uuid().optional(),
    substituteTeacherId: z.string().uuid().optional(),
    reason: z.string().min(3).max(500),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  }),
});

const settingsBody = z.object({
  workingDays: z.array(z.number().int().min(1).max(7)).min(1),
  schoolStartsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  schoolEndsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  lessonDurationMinutes: z.number().int().positive().max(240),
  breakStartsAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  breakEndsAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  lunchStartsAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  lunchEndsAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  maxPeriodsPerDay: z.number().int().positive().max(24),
  maxTeacherPeriodsDay: z.number().int().positive().max(24),
  maxTeacherPeriodsWeek: z.number().int().positive().max(168),
  maxConsecutivePeriods: z.number().int().positive().max(24),
  allowDoublePeriods: z.boolean(),
  allowSaturday: z.boolean(),
});

export const timetableSettingsSchema = z.object({ body: settingsBody });

const teachingAssignmentBody = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  periodsPerWeek: z.number().int().positive().max(60),
  maxPeriodsDay: z.number().int().positive().max(24).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const teachingAssignmentSchema = z.object({ body: teachingAssignmentBody });
export const teachingAssignmentUpdateSchema = z.object({
  params: idParams,
  body: teachingAssignmentBody,
});
export const teachingAssignmentIdSchema = z.object({ params: idParams });
export const teachingAssignmentQuerySchema = z.object({
  query: z.object({
    teacherId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    academicYearId: z.string().uuid().optional(),
    termId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

const subjectPeriodBody = z.object({
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  periodsPerWeek: z.number().int().positive().max(168),
  minimumPeriods: z.number().int().min(0).max(168).default(0),
  maximumPeriods: z.number().int().min(0).max(168).nullable().optional(),
  preferredPeriodsDay: z.number().int().positive().max(24).default(1),
  requiresDoublePeriod: z.boolean().default(false),
  requiresLaboratory: z.boolean().default(false),
  streamRestriction: z.string().trim().min(1).max(120).nullable().optional(),
});
export const subjectPeriodSchema = z.object({ body: subjectPeriodBody });
export const subjectPeriodUpdateSchema = z.object({
  params: idParams,
  body: subjectPeriodBody
    .partial()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field'),
});
export const subjectPeriodIdSchema = z.object({ params: idParams });
export const subjectPeriodQuerySchema = z.object({
  query: subjectPeriodBody
    .pick({ subjectId: true, classId: true, academicYearId: true, termId: true })
    .partial(),
});

export const teacherAvailabilityBody = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  kind: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PREFERRED']).default('AVAILABLE'),
  isRecurring: z.literal(true).default(true),
  priority: z.number().int().min(0).max(100).default(0),
});
const availabilityParams = z.object({ teacherId: z.string().uuid() });
export const teacherAvailabilityListSchema = z.object({ params: availabilityParams });
export const teacherAvailabilitySchema = z.object({
  params: availabilityParams,
  body: teacherAvailabilityBody,
});
export const teacherAvailabilityIdSchema = z.object({
  params: availabilityParams.extend({ id: z.string().uuid() }),
});
export const teacherAvailabilityUpdateSchema = teacherAvailabilityIdSchema.extend({
  body: teacherAvailabilityBody
    .partial()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field'),
});

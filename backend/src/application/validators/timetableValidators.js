import { z } from 'zod';

const entry = z.object({
  timeSlotId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  classroomId: z.string().uuid().optional(),
  subjectCode: z.string().min(1).max(60),
  kind: z.enum(['LESSON', 'BREAK', 'FREE', 'DOUBLE', 'PRACTICAL', 'LABORATORY']).default('LESSON'),
  duration: z.number().int().positive().max(8).default(1),
  notes: z.string().max(500).optional(),
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

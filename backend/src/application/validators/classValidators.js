import { z } from 'zod';
const body = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(40).optional(),
  academicYearId: z.string().uuid(),
  gradeLevelId: z.string().uuid(),
  classroomId: z.string().uuid().optional(),
  section: z.string().trim().max(40).optional(),
  capacity: z.number().int().positive(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
export const classCreateSchema = z.object({ body });
export const classStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'ARCHIVED', 'CANCELLED']),
    reason: z.string().trim().max(500).optional(),
  }),
});
export const classQuerySchema = z.object({
  query: z.object({
    query: z.string().trim().max(100).optional(),
    status: z.string().optional(),
    academicYearId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});
export const enrollmentSchema = z.object({ body: z.object({ studentId: z.string().uuid() }) });
export const classSubjectSchema = z.object({
  body: z
    .object({
      subjectId: z.string().uuid().optional(),
      subject: z
        .object({
          name: z.string().trim().min(1).max(120),
          code: z.string().trim().min(1).max(40).optional(),
          description: z.string().trim().max(1000).optional(),
        })
        .optional(),
    })
    .refine((value) => Boolean(value.subjectId) !== Boolean(value.subject), {
      message: 'Provide either subjectId or subject',
    }),
});

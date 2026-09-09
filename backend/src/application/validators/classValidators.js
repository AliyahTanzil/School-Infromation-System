import { z } from 'zod';
const classId = z.object({ id: z.string().uuid() }).strict();
export const classIdSchema = z.object({ params: classId });
const body = z
  .object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().min(1).max(40).optional(),
    academicYearId: z.string().uuid().optional(),
    academicYear: z.number().int().min(2000).max(2100).optional(),
    gradeLevelId: z.string().uuid().optional(),
    gradeLevelCode: z
      .enum(['PRE_SCHOOL_NURSERY', 'PRIMARY_SCHOOL', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY'])
      .optional(),
    classroomId: z.string().uuid().optional(),
    section: z.string().trim().max(40).optional(),
    capacity: z.number().int().positive(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.academicYearId && value.academicYear === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['academicYear'],
        message: 'Select an academic year',
      });
    }
    if (!value.gradeLevelId && !value.gradeLevelCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gradeLevelCode'],
        message: 'Select a grade level',
      });
    }
  });
export const classCreateSchema = z.object({ body });
export const classStatusSchema = z.object({
  params: classId,
  body: z
    .object({
      status: z.enum(['ACTIVE', 'ARCHIVED', 'CANCELLED']),
      reason: z.string().trim().max(500).optional(),
    })
    .strict(),
});
export const classQuerySchema = z.object({
  query: z
    .object({
      query: z.string().trim().max(100).optional(),
      status: z.enum(['PLANNED', 'ACTIVE', 'ARCHIVED', 'CANCELLED']).optional(),
      academicYearId: z.string().uuid().optional(),
      page: z.coerce.number().int().positive().max(10_000).optional(),
      pageSize: z.coerce.number().int().positive().max(100).optional(),
    })
    .strict(),
});
export const enrollmentSchema = z.object({
  params: classId,
  body: z.object({ studentId: z.string().uuid() }).strict(),
});
export const classSubjectSchema = z.object({
  params: classId,
  body: z
    .object({
      subjectId: z.string().uuid().optional(),
      subject: z
        .object({
          name: z.string().trim().min(1).max(120),
          code: z.string().trim().min(1).max(40).optional(),
          description: z.string().trim().max(1000).optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .refine((value) => Boolean(value.subjectId) !== Boolean(value.subject), {
      message: 'Provide either subjectId or subject',
    }),
});

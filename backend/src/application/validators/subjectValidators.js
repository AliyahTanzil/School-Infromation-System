import { z } from 'zod';

const fields = {
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .transform((value) => value.toUpperCase())
    .optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
};

export const subjectQuerySchema = z.object({
  query: z.object({
    query: z.string().trim().max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  }),
});
export const subjectCreateSchema = z.object({
  body: z
    .object({
      ...fields,
      classAssignments: z
        .array(
          z.object({
            classId: z.string().uuid(),
            teachingFocus: z.string().trim().max(500).optional(),
          })
        )
        .min(1, 'Select at least one class'),
    })
    .strict(),
});
export const subjectUpdateSchema = z.object({ body: subjectCreateSchema.shape.body.partial() });
export const subjectStatusSchema = z.object({
  body: z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']) }).strict(),
});

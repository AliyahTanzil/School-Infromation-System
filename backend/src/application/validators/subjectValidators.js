import { z } from 'zod';

const subjectId = z.object({ id: z.string().uuid() }).strict();
export const subjectIdSchema = z.object({ params: subjectId });

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
  query: z
    .object({
      query: z.string().trim().max(100).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    })
    .strict(),
});
export const subjectCreateSchema = z.object({
  body: z
    .object({
      ...fields,
      classAssignments: z
        .array(
          z
            .object({
              classId: z.string().uuid(),
              teachingFocus: z.string().trim().max(500).optional(),
            })
            .strict()
        )
        .min(1, 'Select at least one class'),
    })
    .strict(),
});
export const subjectUpdateSchema = z.object({
  params: subjectId,
  body: subjectCreateSchema.shape.body
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update'),
});
export const subjectStatusSchema = z.object({
  params: subjectId,
  body: z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']) }).strict(),
});

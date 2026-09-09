import { z } from 'zod';

const text = (max = 200) => z.string().trim().min(1).max(max);
const schoolId = z.object({ id: z.string().uuid() }).strict();
const branchId = z.object({ id: z.string().uuid(), branchId: z.string().uuid() }).strict();

const schoolFields = z
  .object({
    name: text(),
    slug: text(120)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).max(40).optional(),
    website: z.string().trim().url().optional(),
  })
  .strict();

export const schoolListSchema = z.object({
  query: z
    .object({
      search: z.string().trim().min(1).max(100).optional(),
      page: z.coerce.number().int().min(1).max(10_000).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict(),
});
export const schoolSchema = z.object({ body: schoolFields });
export const schoolIdSchema = z.object({ params: schoolId });
export const updateSchoolSchema = z.object({
  params: schoolId,
  body: schoolFields
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});
export const branchListSchema = schoolIdSchema;
export const branchCreateSchema = z.object({
  params: schoolId,
  body: z.object({ name: text(160), code: text(40).optional() }).strict(),
});
export const branchUpdateSchema = z.object({
  params: branchId,
  body: z.object({ name: text(160) }).strict(),
});

export default {
  schoolListSchema,
  schoolSchema,
  schoolIdSchema,
  updateSchoolSchema,
  branchListSchema,
  branchCreateSchema,
  branchUpdateSchema,
};

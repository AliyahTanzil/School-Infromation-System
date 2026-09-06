import { z } from 'zod';
const text = (max = 200) => z.string().trim().min(1).max(max);
export const schoolSchema = z.object({
  body: z.object({
    name: text(),
    slug: text(120)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
    website: z.string().url().optional(),
  }),
  params: z.object({ id: z.string().uuid().optional() }).optional(),
});
export const updateSchoolSchema = z.object({
  body: schoolSchema.shape.body.partial(),
  params: z.object({ id: z.string().uuid() }),
});
export const childSchema = z.object({
  body: z.object({
    name: text(160),
    code: text(40),
    branchId: z.string().uuid().optional(),
    displayOrder: z.number().int().nonnegative().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
export const childUpdateSchema = z.object({
  body: childSchema.shape.body.partial(),
  params: z.object({ id: z.string().uuid() }),
});
export const adminSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    isPrimary: z.boolean().optional(),
    endsAt: z.coerce.date().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
export default { schoolSchema, updateSchoolSchema, childSchema, childUpdateSchema, adminSchema };

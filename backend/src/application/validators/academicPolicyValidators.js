import { z } from 'zod';

const band = z.object({
  label: z.string().trim().min(1).max(20),
  minMark: z.number().min(0).max(100).multipleOf(0.01),
  maxMark: z.number().min(0).max(100).multipleOf(0.01),
  point: z.number().min(0).max(20),
  remark: z.string().trim().max(120).optional(),
});
const weight = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(30),
  weight: z.number().positive().max(100),
  subjectId: z.string().uuid().optional(),
});
export const academicPolicyQuerySchema = z.object({
  query: z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional() }),
});
export const academicPolicyCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(160),
    code: z.string().trim().min(1).max(40),
    passMark: z.number().min(0).max(100),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional(),
    bands: z.array(band).min(1),
    weights: z.array(weight).min(1),
  }),
});
export const academicPolicyStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['ACTIVE', 'ARCHIVED']),
    reason: z.string().trim().max(500).optional(),
  }),
});

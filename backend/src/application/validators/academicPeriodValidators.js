import { z } from 'zod';

const periodBody = z.object({
  name: z.string().trim().min(1).max(160),
  code: z.string().trim().min(1).max(60),
  type: z.enum(['YEAR', 'TERM', 'SEMESTER', 'QUARTER', 'BREAK', 'HOLIDAY', 'EXAM', 'SPECIAL']),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  parentId: z.string().uuid().optional(),
});

export const academicPeriodQuerySchema = z.object({
  query: z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    academicYear: z.string().optional(),
  }),
});
export const academicPeriodCreateSchema = z.object({ body: periodBody });
export const academicPeriodStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']),
    reason: z.string().trim().max(500).optional(),
  }),
});

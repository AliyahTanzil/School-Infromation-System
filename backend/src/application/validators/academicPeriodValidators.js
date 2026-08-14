import { z } from 'zod';

const periodBody = z
  .object({
    name: z.string().trim().min(1).max(160),
    code: z.string().trim().min(1).max(60).optional(),
    type: z.enum(['YEAR', 'TERM']),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    parentId: z.string().uuid().optional(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export const academicPeriodQuerySchema = z.object({
  query: z.object({
    type: z.enum(['YEAR', 'TERM']).optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'CLOSED']).optional(),
  }),
});
export const academicPeriodCreateSchema = z.object({ body: periodBody });
export const academicPeriodStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['PLANNED', 'ACTIVE', 'CLOSED']),
    reason: z.string().trim().max(500).optional(),
  }),
});

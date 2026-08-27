import { z } from 'zod';
const query = z.object({ examinationId: z.string().uuid().optional() });
export const resultQuerySchema = z.object({ query });
export const resultProcessSchema = z.object({
  body: z.object({ examinationId: z.string().uuid(), schemeId: z.string().uuid() }),
});
export const resultStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['APPROVED', 'PUBLISHED', 'LOCKED']) }),
});

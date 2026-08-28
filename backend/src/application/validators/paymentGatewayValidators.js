import { z } from 'zod';
export const intentQuerySchema = z.object({
  query: z.object({ status: z.string().max(40).optional() }),
});
export const intentCreateSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid(),
    amountMinor: z.number().int().positive(),
    currency: z.literal('SLE').default('SLE'),
    channel: z.enum(['MOBILE_MONEY', 'CARD']).default('MOBILE_MONEY'),
    idempotencyKey: z.string().min(8).max(64),
    description: z.string().max(250).optional(),
  }),
});
export const intentParamsSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

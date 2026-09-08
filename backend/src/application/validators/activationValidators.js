import { z } from 'zod';

export const activationDecisionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ decision: z.enum(['approve', 'reject']) }).strict(),
});

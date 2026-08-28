import { z } from 'zod';
export const querySchema = z.object({
  query: z.object({ q: z.string().trim().max(100).optional() }),
});
export const assetSchema = z.object({
  body: z
    .object({
      assetNumber: z.string().trim().min(1).max(50),
      name: z.string().trim().min(1).max(160),
      serialNumber: z.string().max(100).optional(),
      category: z.string().max(80).optional(),
      location: z.string().max(120).optional(),
    })
    .strict(),
});
export const assetStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['ACTIVE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED']) }).strict(),
});
export const itemSchema = z.object({
  body: z
    .object({
      sku: z.string().trim().min(1).max(50),
      name: z.string().trim().min(1).max(160),
      category: z.string().max(80).optional(),
      quantity: z.coerce.number().int().nonnegative().default(0),
      reorderLevel: z.coerce.number().int().nonnegative().default(0),
    })
    .strict(),
});
export const movementSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      type: z.enum(['RECEIPT', 'ISSUE']),
      quantity: z.coerce.number().int().positive(),
      reference: z.string().max(100).optional(),
    })
    .strict(),
});

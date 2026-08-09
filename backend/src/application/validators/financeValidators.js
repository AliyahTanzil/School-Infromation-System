import { z } from 'zod';

const body = z.object({
  tenantId: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeId: z.string().uuid().optional(),
  invoiceNumber: z.string().trim().min(1).max(60),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().optional(),
  dueAt: z.coerce.date().optional(),
});
export const createInvoiceSchema = z.object({ body });
export const paymentSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid(),
    schoolId: z.string().uuid(),
    invoiceId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    provider: z.string().max(40).default('manual'),
    reference: z.string().max(120),
    idempotencyKey: z.string().min(8).max(160),
  }),
});
export const invoiceQuerySchema = z.object({
  query: z.object({
    schoolId: z.string().uuid(),
    studentId: z.string().uuid().optional(),
    status: z.string().optional(),
  }),
});

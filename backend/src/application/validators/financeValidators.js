import { z } from 'zod';
import { isValidInvoiceAmount, isValidPaymentAmount } from '../../domain/financeCalculations.js';

const body = z
  .object({
    studentId: z.string().uuid(),
    feeId: z.string().uuid().optional(),
    invoiceNumber: z.string().trim().min(1).max(60),
    subtotal: z.coerce
      .number()
      .refine(isValidInvoiceAmount, 'Invalid invoice precision or amount limit'),
    discount: z.coerce
      .number()
      .refine(isValidInvoiceAmount, 'Invalid invoice precision or amount limit')
      .optional(),
    dueAt: z.coerce.date().optional(),
  })
  .strict()
  .refine((value) => (value.discount ?? 0) <= value.subtotal, {
    message: 'Discount must not exceed subtotal',
    path: ['discount'],
  });
export const createInvoiceSchema = z.object({ body });
export const paymentSchema = z.object({
  body: z
    .object({
      invoiceId: z.string().uuid(),
      amount: z.coerce
        .number()
        .refine(isValidPaymentAmount, 'Invalid payment precision or amount limit'),
      provider: z.string().max(40).default('manual'),
      reference: z.string().max(120),
      idempotencyKey: z.string().min(8).max(160),
    })
    .strict(),
});
export const invoiceQuerySchema = z.object({
  query: z
    .object({
      studentId: z.string().uuid().optional(),
      status: z.string().trim().min(1).max(40).optional(),
    })
    .strict(),
});
export const paymentParamsSchema = z.object({
  params: z.object({ paymentId: z.string().uuid() }).strict(),
});
export const transactionQuerySchema = z.object({
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }).strict(),
});

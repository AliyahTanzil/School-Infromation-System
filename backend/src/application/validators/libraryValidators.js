import { z } from 'zod';
export const libraryCreateSchema = z.object({
  body: z.object({ name: z.string().trim().min(1).max(120) }).strict(),
});
export const libraryParamsSchema = z.object({ params: z.object({ libraryId: z.string().uuid() }) });
export const bookQuerySchema = z.object({
  params: z.object({ libraryId: z.string().uuid() }),
  query: z.object({ q: z.string().trim().max(100).optional() }),
});
export const bookCreateSchema = z.object({
  params: z.object({ libraryId: z.string().uuid() }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200),
      author: z.string().trim().min(1).max(160),
      isbn: z.string().trim().max(30).optional(),
      category: z.string().trim().max(80).optional(),
    })
    .strict(),
});
export const copyCreateSchema = z.object({
  params: z.object({ libraryId: z.string().uuid(), bookId: z.string().uuid() }),
  body: z.object({ barcode: z.string().trim().min(1).max(80) }).strict(),
});
export const loanCreateSchema = z.object({
  params: z.object({ libraryId: z.string().uuid() }),
  body: z
    .object({ copyId: z.string().uuid(), borrowerId: z.string().uuid(), dueAt: z.coerce.date() })
    .strict(),
});
export const loanParamsSchema = z.object({
  params: z.object({ libraryId: z.string().uuid(), loanId: z.string().uuid() }),
});

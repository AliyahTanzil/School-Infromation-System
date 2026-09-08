import { z } from 'zod';

export const profileSchema = z.object({
  body: z
    .object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      occupation: z.string().trim().max(160).optional(),
      preferredLanguage: z.string().trim().max(20).optional(),
    })
    .strict(),
});
export const linkSchema = z.object({
  body: z
    .object({ studentId: z.string().uuid(), relationship: z.string().trim().min(1).max(60) })
    .strict(),
});
export const unlinkSchema = z.object({
  params: z.object({ studentId: z.string().uuid() }),
});
export const preferenceSchema = z
  .object({
    locale: z.string().max(20).optional(),
    timezone: z.string().max(80).optional(),
    theme: z.enum(['system', 'light', 'dark']).optional(),
  })
  .strict();
export const notificationSchema = z
  .object({
    announcements: z.boolean().optional(),
    attendance: z.boolean().optional(),
    results: z.boolean().optional(),
    fees: z.boolean().optional(),
  })
  .strict();

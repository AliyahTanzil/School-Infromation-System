import { z } from 'zod';
export const dormitorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(150),
      genderPolicy: z.enum(['MALE', 'FEMALE', 'MIXED']).default('MIXED'),
    })
    .strict(),
});
export const roomSchema = z.object({
  params: z.object({ dormitoryId: z.string().uuid() }),
  body: z
    .object({
      roomNumber: z.string().trim().min(1).max(40),
      bedCount: z.coerce.number().int().positive().max(50),
    })
    .strict(),
});
export const applicationSchema = z.object({
  body: z.object({ studentId: z.string().uuid(), notes: z.string().max(500).optional() }).strict(),
});
export const decisionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict(),
});
export const allocationSchema = z.object({
  body: z.object({ studentId: z.string().uuid(), bedId: z.string().uuid() }).strict(),
});
export const allocationParamsSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

import { z } from 'zod';

const attachment = z.object({
  materialId: z.string().uuid(),
  name: z.string().trim().min(1).max(180),
});

export const submissionListSchema = z.object({
  query: z.object({ assignmentId: z.string().uuid().optional() }),
});

export const submissionSaveSchema = z.object({
  body: z
    .object({
      assignmentId: z.string().uuid(),
      body: z.string().trim().min(1).max(50000),
      attachments: z.array(attachment).max(20).default([]),
      status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
    })
    .strict(),
});

export const submissionStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.literal('DRAFT') }).strict(),
});

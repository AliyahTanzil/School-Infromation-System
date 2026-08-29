import { z } from 'zod';

export const materialListSchema = z.object({
  query: z.object({ classroomId: z.string().uuid() }),
});

export const materialUploadSchema = z.object({
  body: z
    .object({
      classroomId: z.string().uuid(),
      title: z.string().trim().min(1).max(180).optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
});

export const materialArchiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

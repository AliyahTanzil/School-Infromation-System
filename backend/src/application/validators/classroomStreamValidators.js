import { z } from 'zod';

const classroomParams = z.object({ classroomId: z.string().uuid() });
export const streamParamsSchema = z.object({ params: classroomParams });
export const announcementSchema = z.object({
  params: classroomParams,
  body: z
    .object({
      title: z.string().trim().min(1).max(180),
      body: z.string().trim().min(1).max(5000),
      status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
    })
    .strict(),
});
export const postSchema = z.object({
  params: classroomParams,
  body: z
    .object({
      body: z.string().trim().min(1).max(5000),
      attachments: z
        .array(z.object({ name: z.string(), url: z.string().url() }))
        .max(10)
        .default([]),
    })
    .strict(),
});
export const commentSchema = z.object({
  params: z.object({ postId: z.string().uuid() }),
  body: z.object({ body: z.string().trim().min(1).max(2000) }).strict(),
});

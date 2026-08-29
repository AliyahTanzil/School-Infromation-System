import { z } from 'zod';

export const assignmentQuerySchema = z.object({
  query: z.object({
    classroomId: z.string().uuid(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  }),
});
export const assignmentCreateSchema = z.object({
  body: z
    .object({
      classroomId: z.string().uuid(),
      subjectId: z.string().uuid().optional(),
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().max(2000).optional(),
      instructions: z.string().trim().max(10000).optional(),
      topic: z.string().trim().max(120).optional(),
      type: z.enum(['ASSIGNMENT', 'LESSON', 'PROJECT']).default('ASSIGNMENT'),
      availableAt: z.coerce.date().optional(),
      dueAt: z.coerce.date().optional(),
      points: z.coerce.number().int().min(0).max(10000).default(0),
    })
    .strict(),
});
export const assignmentStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']) }).strict(),
});

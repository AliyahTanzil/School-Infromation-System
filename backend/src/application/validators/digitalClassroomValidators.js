import { z } from 'zod';

export const classroomCreateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(150),
      code: z
        .string()
        .trim()
        .min(2)
        .max(40)
        .regex(/^[A-Za-z0-9_-]+$/)
        .optional(),
      description: z.string().trim().max(1000).optional(),
      classId: z.string().uuid().optional(),
    })
    .strict(),
});

export const classroomParamsSchema = z.object({
  params: z.object({ classroomId: z.string().uuid() }),
});

export const memberSchema = z.object({
  params: z.object({ classroomId: z.string().uuid() }),
  body: z
    .object({ userId: z.string().uuid(), role: z.enum(['TEACHER', 'STUDENT', 'GUARDIAN']) })
    .strict(),
});

export const memberParamsSchema = z.object({
  params: z.object({ classroomId: z.string().uuid(), userId: z.string().uuid() }),
});

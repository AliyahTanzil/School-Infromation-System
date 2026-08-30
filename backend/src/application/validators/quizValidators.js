import { z } from 'zod';

const answerValue = z.union([z.string().trim().max(5000), z.number(), z.boolean()]);

export const quizListSchema = z.object({
  query: z.object({ classroomId: z.string().uuid() }),
});
export const quizIdSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const quizCreateSchema = z.object({
  body: z
    .object({
      classroomId: z.string().uuid(),
      assignmentId: z.string().uuid().optional(),
      assessmentWeightId: z.string().uuid().optional(),
      title: z.string().trim().min(1).max(180),
      instructions: z.string().trim().max(5000).optional(),
      durationMinutes: z.coerce.number().int().min(1).max(240).default(30),
      maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
    })
    .strict(),
});
export const quizQuestionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
      prompt: z.string().trim().min(1).max(5000),
      options: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
      correctAnswer: answerValue,
      points: z.coerce.number().int().min(1).max(100).default(1),
    })
    .strict(),
});
export const quizStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']) }).strict(),
});
export const quizAttemptAnswerSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
  body: z.object({ questionId: z.string().uuid(), response: answerValue }).strict(),
});
export const quizAttemptIdSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
});

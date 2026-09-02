import { z } from 'zod';

const id = z.string().uuid();

export const rubricListSchema = z.object({ query: z.object({ classroomId: id }) });
export const rubricCreateSchema = z.object({
  body: z
    .object({
      classroomId: id,
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().max(2000).optional(),
      criteria: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(180),
            description: z.string().trim().max(1000).optional(),
            maxPoints: z.coerce.number().int().min(1).max(1000),
          })
        )
        .min(1)
        .max(25),
    })
    .strict(),
});
export const rubricStatusSchema = z.object({
  params: z.object({ id }),
  body: z.object({ status: z.enum(['PUBLISHED', 'ARCHIVED']) }).strict(),
});
export const gradeListSchema = z.object({ query: z.object({ assignmentId: id }) });
export const gradeSaveSchema = z.object({
  params: z.object({ submissionId: id }),
  body: z
    .object({
      score: z.coerce.number().int().min(0),
      maxScore: z.coerce.number().int().min(1),
      summary: z.string().trim().max(5000).optional(),
      rubricScores: z
        .array(
          z.object({
            criterionId: id,
            points: z.coerce.number().int().min(0),
            comment: z.string().trim().max(1000).optional(),
          })
        )
        .max(25)
        .default([]),
    })
    .strict(),
});
export const gradeIdSchema = z.object({ params: z.object({ id }) });
export const feedbackSchema = z.object({
  params: z.object({ id }),
  body: z.object({ body: z.string().trim().min(1).max(5000) }).strict(),
});

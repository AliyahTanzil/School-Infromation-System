import { z } from 'zod';
const statuses = [
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'MARKING',
  'MODERATION',
  'APPROVAL',
  'LOCKED',
  'ARCHIVED',
];
export const examinationQuerySchema = z.object({
  query: z.object({ status: z.enum(statuses).optional() }),
});
export const examinationCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(160),
    code: z.string().trim().min(1).max(40),
  }),
});
export const examinationStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(statuses.slice(1)),
    reason: z.string().trim().max(500).optional(),
  }),
});
export const examinationCandidateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ studentId: z.string().uuid(), classId: z.string().uuid() }),
});
export const examinationScheduleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    classId: z.string().uuid(),
    subjectCode: z.string().trim().min(1).max(40),
    scheduledAt: z.coerce.date(),
  }),
});
export const examinationMarkSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    candidateId: z.string().uuid(),
    subjectCode: z.string().trim().min(1).max(40),
    score: z.number().min(0),
    maxScore: z.number().positive(),
  }),
});

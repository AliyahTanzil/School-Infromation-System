import { z } from 'zod';

export const liveSessionQuerySchema = z.object({
  query: z.object({
    classroomId: z.string().uuid().optional(),
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
  }),
});

export const liveSessionCreateSchema = z.object({
  body: z
    .object({
      classroomId: z.string().uuid(),
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().max(2000).optional(),
      scheduledAt: z.coerce.date(),
      meetingUrl: z.string().url().optional(),
      roomCode: z.string().trim().max(60).optional(),
      status: z.enum(['SCHEDULED', 'LIVE']).optional(),
    })
    .strict(),
});

export const liveSessionStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      status: z.enum(['LIVE', 'ENDED', 'CANCELLED']),
      recordingUrl: z.string().url().optional(),
      recordingTitle: z.string().trim().max(180).optional(),
    })
    .strict(),
});

export const liveSessionParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

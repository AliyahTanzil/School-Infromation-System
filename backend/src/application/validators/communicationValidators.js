import { z } from 'zod';
export const notificationQuerySchema = z.object({
  query: z.object({
    status: z.string().max(40).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
export const notificationCreateSchema = z.object({
  body: z.object({
    eventType: z.string().min(2).max(100),
    aggregateType: z.string().max(100).optional(),
    aggregateId: z.string().max(160).optional(),
    payload: z.object({
      title: z.string().min(1).max(160),
      body: z.string().min(1).max(2000),
      priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
      link: z.string().max(500).optional(),
    }),
    userIds: z.array(z.string().uuid()).min(1).max(500),
    channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH'])).min(1),
  }),
});
export const notificationParamsSchema = z.object({
  params: z.object({ notificationId: z.string().uuid() }),
});
export const preferenceSchema = z.object({
  body: z.object({
    channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']),
    enabled: z.boolean(),
    quietHours: z.object({ startsAt: z.string(), endsAt: z.string() }).optional(),
  }),
});

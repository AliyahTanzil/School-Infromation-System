import { z } from 'zod';

export const classroomCalendarQuerySchema = z.object({
  query: z.object({
    classroomId: z.string().uuid(),
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
});

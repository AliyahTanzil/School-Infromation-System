import { z } from 'zod';
import { validCalendarRange, CALENDAR_RANGE_ERROR } from '../../domain/classroomCalendarRange.js';

export const classroomCalendarQuerySchema = z.object({
  query: z
    .object({
      classroomId: z.string().uuid(),
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .strict()
    .refine(({ start, end }) => validCalendarRange(start, end), {
      message: CALENDAR_RANGE_ERROR,
      path: ['end'],
    }),
});

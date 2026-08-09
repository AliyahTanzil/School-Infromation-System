import { z } from 'zod';

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  classId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'LOCKED', 'ARCHIVED']).optional(),
});

export const attendanceSessionCreateSchema = z.object({
  classId: z.string().uuid(),
  periodId: z.string().uuid().optional(),
  sessionDate: z.coerce.date(),
  title: z.string().trim().min(2).max(160),
});

export const attendanceSessionStatusSchema = z.object({
  status: z.enum(['OPEN', 'LOCKED', 'ARCHIVED']),
  reason: z.string().trim().max(500).optional(),
});

export const attendanceBulkSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HALF_DAY']),
        note: z.string().trim().max(500).optional(),
      })
    )
    .min(1)
    .max(500),
});

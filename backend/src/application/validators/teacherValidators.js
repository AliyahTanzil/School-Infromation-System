import { z } from 'zod';

const teacherStatuses = [
  'APPLICANT',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
  'RETIRED',
];

const teacherId = z.object({ id: z.string().uuid() }).strict();
const teacherQuery = z
  .object({
    status: z.enum(teacherStatuses).optional(),
    query: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
const teacherCreate = z
  .object({
    employeeNumber: z.string().trim().min(1).max(60),
    profile: z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().email().optional(),
        phone: z.string().trim().min(1).max(40).optional(),
      })
      .strict(),
    employment: z
      .object({
        jobTitle: z.string().trim().min(1).max(160),
        employmentType: z.string().trim().min(1).max(40),
        startDate: z.coerce.date(),
      })
      .strict()
      .optional(),
  })
  .strict();
const teacherStatus = z
  .object({
    status: z.enum(teacherStatuses.filter((status) => status !== 'APPLICANT')),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const teacherQuerySchema = z.object({ query: teacherQuery });
export const teacherIdSchema = z.object({ params: teacherId });
export const teacherCreateSchema = z.object({ body: teacherCreate });
export const teacherStatusSchema = z.object({ params: teacherId, body: teacherStatus });

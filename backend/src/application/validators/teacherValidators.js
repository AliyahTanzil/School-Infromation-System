import { z } from 'zod';

const teacherQuery = z.object({
  status: z.string().optional(),
  query: z.string().trim().max(100).optional(),
});
const teacherCreate = z.object({
  employeeNumber: z.string().trim().min(1).max(60),
  profile: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().email().optional(),
    phone: z.string().max(40).optional(),
  }),
  employment: z
    .object({
      jobTitle: z.string().min(1).max(160),
      employmentType: z.string().min(1).max(40),
      startDate: z.coerce.date(),
    })
    .optional(),
});
const teacherStatus = z.object({
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED']),
  reason: z.string().trim().max(500).optional(),
});
export const teacherQuerySchema = z.object({ query: teacherQuery });
export const teacherCreateSchema = z.object({ body: teacherCreate });
export const teacherStatusSchema = z.object({ body: teacherStatus });

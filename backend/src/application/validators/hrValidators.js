import { z } from 'zod';

const optionalUuid = z.string().uuid().nullish();
export const employeeQuerySchema = z.object({
  query: z.object({ status: z.enum(['APPLICANT', 'ACTIVE', 'ON_LEAVE', 'INACTIVE']).optional() }),
});
export const employeeCreateSchema = z.object({
  body: z
    .object({
      employeeNumber: z.string().trim().min(1).max(40),
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      email: z.string().email().nullish(),
      departmentId: optionalUuid,
      positionId: optionalUuid,
    })
    .strict(),
});
export const leaveCreateSchema = z.object({
  body: z
    .object({
      employeeId: z.string().uuid(),
      leaveType: z.string().trim().min(1).max(50),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
      reason: z.string().trim().max(500).optional(),
    })
    .strict()
    .refine((value) => value.endsAt >= value.startsAt, {
      message: 'Leave end date must not precede its start date',
      path: ['endsAt'],
    }),
});
export const leaveDecisionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict(),
});
export const payrollCreateSchema = z.object({
  body: z
    .object({
      periodStart: z.coerce.date(),
      periodEnd: z.coerce.date(),
    })
    .strict()
    .refine((value) => value.periodEnd >= value.periodStart, {
      message: 'Payroll end date must not precede its start date',
      path: ['periodEnd'],
    }),
});
export const payrollParamsSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

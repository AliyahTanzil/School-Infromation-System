import { z } from 'zod';

const studentFields = z.object({
  admissionNumber: z.string().trim().min(1).max(60).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth: z.coerce.date().min(new Date('1900-01-01')).max(new Date()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']).optional(),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().max(40).optional(),
});

export const studentDomainQuerySchema = z.object({
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().min(1).max(10000).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
});

export const studentDomainIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
});

export const studentDomainCreateSchema = z.object({
  body: studentFields.strict(),
});

export const studentDomainUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: studentFields
    .partial()
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Provide at least one student field to update',
    }),
});

export const studentDomainGuardianSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: z
    .object({
      guardianId: z.string().uuid().optional(),
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      email: z.string().trim().email().max(320).optional(),
      phone: z.string().trim().max(40).optional(),
      relationship: z.string().trim().min(1).max(60),
      isPrimary: z.boolean().optional(),
    })
    .strict()
    .superRefine((value, context) => {
      if (!value.guardianId && (!value.firstName || !value.lastName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'First and last name are required for a new guardian',
        });
      }
    }),
});

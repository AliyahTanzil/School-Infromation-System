import { z } from 'zod';

export const listStudentSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(['APPLICANT', 'ADMITTED', 'ACTIVE', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN', 'SUSPENDED'])
    .optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createStudentSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(60),
  profile: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    dateOfBirth: z.coerce.date(),
    preferredName: z.string().trim().max(100).optional(),
    gender: z.string().trim().max(30).optional(),
    email: z.string().email().max(320).optional(),
    phone: z.string().trim().max(40).optional(),
  }),
  admission: z
    .object({
      entryGrade: z.string().trim().max(80).optional(),
      source: z.string().trim().max(120).optional(),
      notes: z.string().max(5000).optional(),
    })
    .optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
export const statusSchema = z.object({
  status: z.enum(['ADMITTED', 'ACTIVE', 'TRANSFERRED', 'GRADUATED', 'WITHDRAWN', 'SUSPENDED']),
  reason: z.string().trim().max(500).optional(),
});
export const guardianSchema = z.object({
  guardian: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().email().max(320).optional(),
    phone: z.string().trim().max(40).optional(),
    address: z.string().max(500).optional(),
  }),
  link: z.object({
    relationship: z.string().trim().min(1).max(60),
    isPrimary: z.boolean().optional(),
    canPickup: z.boolean().optional(),
    canContact: z.boolean().optional(),
  }),
});
export const medicalSchema = z.object({
  bloodType: z.string().trim().max(10).optional(),
  allergies: z.string().max(5000).optional(),
  conditions: z.string().max(5000).optional(),
  medications: z.string().max(5000).optional(),
  emergencyNotes: z.string().max(5000).optional(),
});

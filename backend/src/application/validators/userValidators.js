import { z } from 'zod';

const profile = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    preferredName: z.string().max(100).optional(),
    phone: z.string().max(40).optional(),
    dateOfBirth: z.coerce.date().optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  })
  .partial();
const preference = z.object({
  locale: z.string().max(20).optional(),
  timezone: z.string().max(80).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  emailAlerts: z.boolean().optional(),
  smsAlerts: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
});
const listUsersFields = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'SUSPENDED']).optional(),
  roleCode: z.string().max(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().uuid().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'email', 'status']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
});
export const listUsersSchema = z.object({ query: listUsersFields });
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    password: z.string().min(12).max(128),
    accountType: z.enum(['STAFF', 'TEACHER', 'PARENT', 'STUDENT']).default('STAFF'),
    status: z.enum(['PENDING_VERIFICATION', 'ACTIVE']).optional(),
    profile: profile.optional(),
    preference: preference.optional(),
  }),
});
export const updateUserSchema = z.object({
  body: z
    .object({
      email: z.string().email().max(320).optional(),
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      profile: profile.optional(),
      preference: preference.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});
export const statusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']),
    reason: z.string().max(500).optional(),
  }),
});
export const profileSchema = z.object({
  body: z
    .object({ profile: profile.optional(), preference: preference.optional() })
    .refine((v) => v.profile || v.preference, 'Profile or preference is required'),
});
export const reasonSchema = z.object({
  body: z.object({ reason: z.string().max(500).optional() }),
});

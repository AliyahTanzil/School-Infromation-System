import { z } from 'zod';

const profile = z
  .object({
    designation: z.string().trim().min(1).max(100).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one profile field is required');
const preference = z
  .object({
    locale: z.string().trim().min(2).max(20).optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
    theme: z.enum(['system', 'light', 'dark']).optional(),
    emailAlerts: z.boolean().optional(),
    smsAlerts: z.boolean().optional(),
    profileVisible: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one preference is required');
const userId = z.object({ id: z.string().uuid() }).strict();
const listUsersFields = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    status: z
      .enum(['INVITED', 'PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'SUSPENDED', 'DISABLED'])
      .optional(),
    roleCode: z.string().trim().min(1).max(100).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().uuid().optional(),
    sort: z.enum(['createdAt', 'updatedAt', 'email', 'status']).default('createdAt'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();
export const listUsersSchema = z.object({ query: listUsersFields });
export const createUserSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().max(320),
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      password: z.string().min(12).max(128),
      accountType: z.enum(['STAFF', 'TEACHER', 'PARENT', 'STUDENT']).default('STAFF'),
      status: z.enum(['PENDING_VERIFICATION', 'ACTIVE']).optional(),
      profile: profile.optional(),
      preference: preference.optional(),
    })
    .strict(),
});
export const updateUserSchema = z.object({
  params: userId,
  body: z
    .object({
      email: z.string().email().max(320).optional(),
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      profile: profile.optional(),
      preference: preference.optional(),
    })
    .strict()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});
export const statusSchema = z.object({
  params: userId,
  body: z
    .object({
      status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']),
      reason: z.string().trim().min(1).max(500).optional(),
    })
    .strict(),
});
export const profileSchema = z.object({
  params: userId,
  body: z
    .object({ profile: profile.optional(), preference: preference.optional() })
    .strict()
    .refine((v) => v.profile || v.preference, 'Profile or preference is required'),
});
export const reasonSchema = z.object({
  params: userId,
  body: z.object({ reason: z.string().trim().min(1).max(500).optional() }).strict(),
});
export const userIdSchema = z.object({ params: userId });
export const getUserSchema = z.object({
  params: userId,
  query: z.object({ includeDeleted: z.enum(['true', 'false']).default('false') }).strict(),
});
export const pushTokenSchema = z.object({
  body: z
    .object({
      deviceFingerprint: z.string().trim().min(1).max(255),
      platform: z.string().trim().min(1).max(40).optional(),
      pushToken: z
        .string()
        .trim()
        .max(512)
        .regex(/^ExponentPushToken\[[^\]]+\]$/, 'Invalid Expo push token'),
    })
    .strict(),
});

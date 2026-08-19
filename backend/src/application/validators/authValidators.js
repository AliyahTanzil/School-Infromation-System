import { z } from 'zod';

/**
 * Zod schemas for every auth endpoint. These enforce shape/format only.
 * Password *strength* policy is enforced by PasswordService so it stays in one
 * place and applies equally to registration, reset, and change flows.
 */

const email = z.string().trim().toLowerCase().email('A valid email address is required').max(320);
const password = z.string().min(1, 'Password is required').max(128);
const requiredToken = z.string().trim().min(1, 'Token is required');

export const registerSchema = z.object({
  body: z.object({
    email,
    password,
    deviceName: z.string().trim().max(255).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    designation: z.string().trim().max(120).optional(),
    schoolName: z.string().trim().max(200).optional(),
    schoolMotto: z.string().trim().max(300).optional(),
    schoolCity: z.string().trim().max(100).optional(),
    schoolCountry: z.string().trim().max(100).optional(),
    primaryColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    secondaryColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    badgeUrl: z.string().max(2800000).optional(),
    accountType: z.literal('TENANT_ADMIN').default('TENANT_ADMIN'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
    deviceName: z.string().trim().max(255).optional(),
  }),
});

export const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().trim().min(1).optional(),
    })
    .default({}),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: requiredToken,
    password,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: requiredToken }),
});

export const resendVerificationSchema = z.object({
  body: z.object({ email }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('A valid session id is required') }),
});

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  sessionIdParamSchema,
};

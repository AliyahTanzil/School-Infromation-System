import { z } from 'zod';

const code = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .regex(/^[a-z0-9_.-]+$/i);

export const roleIdSchema = z.object({ id: z.string().uuid() });
export const permissionIdSchema = z.object({ id: z.string().uuid() });
export const createRoleSchema = z.object({
  code: code.max(100),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  isAssignable: z.boolean().optional(),
});
export const updateRoleSchema = createRoleSchema.partial();
export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  scopeKey: z.string().trim().min(1).max(255).default('global'),
  expiresAt: z.coerce.date().nullable().optional(),
});
export const assignPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});

export default {
  roleIdSchema,
  permissionIdSchema,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  assignPermissionSchema,
};

import { Router } from 'express';
import controller from '../controllers/rbacController.js';
import authenticate from '../../../middleware/auth/authenticate.js';
import validate from '../../../middleware/validation/validate.js';
import { requirePermission } from '../../../middleware/auth/permissionMiddleware.js';
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
} from '../../../application/validators/rbacValidators.js';

const router = Router();
router.use(authenticate);
router.get('/roles', requirePermission('roles.read'), controller.listRoles);
router.get('/roles/:id', requirePermission('roles.read'), controller.getRole);
router.post(
  '/roles',
  requirePermission('roles.create'),
  validate(createRoleSchema),
  controller.createRole
);
router.patch(
  '/roles/:id',
  requirePermission('roles.update'),
  validate(updateRoleSchema),
  controller.updateRole
);
router.delete('/roles/:id', requirePermission('roles.delete'), controller.deleteRole);
router.post(
  '/roles/:id/permissions',
  requirePermission('permissions.assign'),
  validate(assignPermissionSchema),
  controller.assignPermission
);
router.get('/permissions', requirePermission('permissions.read'), controller.listPermissions);
router.get('/me/permissions', controller.myPermissions);

export default router;

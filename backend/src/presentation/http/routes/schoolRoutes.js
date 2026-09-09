import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/schoolController.js';
import {
  schoolSchema,
  schoolListSchema,
  schoolIdSchema,
  branchListSchema,
  branchCreateSchema,
  branchUpdateSchema,
  updateSchoolSchema,
} from '../../../application/validators/schoolValidators.js';
import { featureUnavailableRoutes } from './featureUnavailableRoutes.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('schools.read'), validate(schoolListSchema), controller.list);
router.get(
  '/:id/branches',
  requirePermission('schools.read'),
  validate(branchListSchema),
  controller.listBranches
);
router.post(
  '/:id/branches',
  requirePermission('schools.branches'),
  validate(branchCreateSchema),
  controller.createBranch
);
router.patch(
  '/:id/branches/:branchId',
  requirePermission('schools.branches'),
  validate(branchUpdateSchema),
  controller.updateBranch
);
router.post('/', requirePermission('schools.create'), validate(schoolSchema), controller.create);
router.get('/:id', requirePermission('schools.read'), validate(schoolIdSchema), controller.get);
router.put(
  '/:id',
  requirePermission('schools.update'),
  validate(updateSchoolSchema),
  controller.update
);
router.delete(
  '/:id',
  requirePermission('schools.delete'),
  validate(schoolIdSchema),
  controller.remove
);
router.use(
  '/:id/admins',
  requirePermission('schools.assign'),
  validate(schoolIdSchema),
  featureUnavailableRoutes('School administrator assignments', 'RBAC-002')
);
export default router;

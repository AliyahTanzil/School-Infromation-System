import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import requireSchoolContext from '../../../middleware/auth/schoolContext.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/schoolController.js';
import {
  schoolSchema,
  branchSchema,
  updateSchoolSchema,
  childSchema,
  adminSchema,
} from '../../../application/validators/schoolValidators.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('schools.read'), controller.list);
router.get('/:id/branches', requirePermission('schools.read'), controller.listBranches);
router.post(
  '/:id/branches',
  requirePermission('schools.branches'),
  validate(branchSchema),
  controller.createBranch
);
router.patch(
  '/:id/branches/:branchId',
  requirePermission('schools.branches'),
  validate(branchSchema),
  controller.updateBranch
);
router.post('/', requirePermission('schools.create'), validate(schoolSchema), controller.create);
router.get('/:id', requireSchoolContext, requirePermission('schools.read'), controller.get);
router.put(
  '/:id',
  requirePermission('schools.update'),
  validate(updateSchoolSchema),
  controller.update
);
router.delete('/:id', requirePermission('schools.delete'), controller.remove);
for (const [model, permission] of [
  ['schoolBranch', 'schools.branches'],
  ['department', 'schools.departments'],
  ['gradeLevel', 'schools.grades'],
]) {
  router.get(
    '/:id/' + model,
    requireSchoolContext,
    requirePermission(permission),
    (req, res, next) => {
      req.params.model = model;
      controller.children(req, res, next);
    }
  );
  router.post(
    '/:id/' + model,
    requireSchoolContext,
    requirePermission(permission),
    validate(childSchema),
    (req, res, next) => {
      req.params.model = model;
      controller.addChild(req, res, next);
    }
  );
}
router.get('/:id/admins', requirePermission('schools.assign'), controller.admins);
router.post(
  '/:id/admins',
  requirePermission('schools.assign'),
  validate(adminSchema),
  controller.assignAdmin
);
router.delete('/:id/admins/:userId', requirePermission('schools.assign'), controller.revokeAdmin);
export default router;

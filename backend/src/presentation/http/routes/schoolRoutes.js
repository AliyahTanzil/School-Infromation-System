import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/schoolController.js';
import {
  schoolSchema,
  updateSchoolSchema,
  childSchema,
  adminSchema,
} from '../../../application/validators/schoolValidators.js';
const router = Router();
router.use(authenticate);
router.get('/', requirePermission('schools.read'), controller.list);
router.post('/', requirePermission('schools.create'), validate(schoolSchema), controller.create);
router.get('/:id', requirePermission('schools.read'), controller.get);
router.put(
  '/:id',
  requirePermission('schools.update'),
  validate(updateSchoolSchema),
  controller.update
);
router.delete('/:id', requirePermission('schools.delete'), controller.remove);
for (const [model, permission] of [
  ['schoolBranch', 'schools.manage_branches'],
  ['department', 'schools.manage_departments'],
  ['gradeLevel', 'schools.manage_grades'],
]) {
  router.get('/:id/' + model, requirePermission(permission), (req, res, next) => {
    req.params.model = model;
    controller.children(req, res, next);
  });
  router.post(
    '/:id/' + model,
    requirePermission(permission),
    validate(childSchema),
    (req, res, next) => {
      req.params.model = model;
      controller.addChild(req, res, next);
    }
  );
}
router.get('/:id/admins', requirePermission('schools.assign_admins'), controller.admins);
router.post(
  '/:id/admins',
  requirePermission('schools.assign_admins'),
  validate(adminSchema),
  controller.assignAdmin
);
router.delete(
  '/:id/admins/:userId',
  requirePermission('schools.assign_admins'),
  controller.revokeAdmin
);
export default router;

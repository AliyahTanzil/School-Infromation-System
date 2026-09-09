import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import { requirePermission } from '../../../middleware/auth/authorization.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/studentDomainController.js';
import {
  studentDomainCreateSchema,
  studentDomainGuardianSchema,
  studentDomainIdSchema,
  studentDomainQuerySchema,
  studentDomainUpdateSchema,
} from '../../../application/validators/studentDomainValidators.js';

const router = Router();
router.use(authenticate, singleSchoolContext);
router.get(
  '/',
  requirePermission('students.read'),
  validate(studentDomainQuerySchema),
  controller.list
);
router.get(
  '/:id',
  requirePermission('students.read'),
  validate(studentDomainIdSchema),
  controller.get
);
router.post(
  '/',
  requirePermission('students.create'),
  validate(studentDomainCreateSchema),
  controller.create
);
router.patch(
  '/:id',
  requirePermission('students.update'),
  validate(studentDomainUpdateSchema),
  controller.update
);
router.post(
  '/:id/guardians',
  requirePermission('students.update'),
  validate(studentDomainGuardianSchema),
  controller.addGuardian
);
export default router;

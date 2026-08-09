import { Router } from 'express';
import controller from '../controllers/studentController.js';
import { requirePermission } from '../../../middleware/auth/permissionMiddleware.js';
import requireSchoolContext from '../../../middleware/auth/schoolContext.js';
import validate from '../../../middleware/validation/validate.js';
import {
  listStudentSchema,
  createStudentSchema,
  updateStudentSchema,
  statusSchema,
  guardianSchema,
  medicalSchema,
} from '../../../application/validators/studentValidators.js';

const router = Router();
router.use(requireSchoolContext);
router.get(
  '/',
  requirePermission('students.read'),
  validate(listStudentSchema, 'query'),
  controller.list
);
router.post(
  '/',
  requirePermission('students.create'),
  validate(createStudentSchema),
  controller.create
);
router.get('/:id', requirePermission('students.read'), controller.get);
router.patch(
  '/:id',
  requirePermission('students.update'),
  validate(updateStudentSchema),
  controller.update
);
router.post(
  '/:id/status',
  requirePermission('students.status'),
  validate(statusSchema),
  controller.changeStatus
);
router.post(
  '/:id/guardians',
  requirePermission('students.update'),
  validate(guardianSchema),
  controller.addGuardian
);
router.put(
  '/:id/medical',
  requirePermission('students.medical'),
  validate(medicalSchema),
  controller.updateMedical
);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/assignmentController.js';
import {
  assignmentQuerySchema,
  assignmentCreateSchema,
  assignmentStatusSchema,
} from '../../../application/validators/assignmentValidators.js';

const router = Router();
router.use(authenticate, teacherContext);
router.get('/', validate(assignmentQuerySchema), controller.list);
router.post(
  '/',
  authorizeSchoolAdminOrTeacher,
  validate(assignmentCreateSchema),
  controller.create
);
router.patch(
  '/:id/status',
  authorizeSchoolAdminOrTeacher,
  validate(assignmentStatusSchema),
  controller.updateStatus
);
export default router;

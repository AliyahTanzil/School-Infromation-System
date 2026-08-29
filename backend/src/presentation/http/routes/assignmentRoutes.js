import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
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
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(assignmentCreateSchema),
  controller.create
);
router.patch(
  '/:id/status',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(assignmentStatusSchema),
  controller.updateStatus
);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/submissionController.js';
import {
  submissionListSchema,
  submissionSaveSchema,
  submissionStatusSchema,
} from '../../../application/validators/submissionValidators.js';

const router = Router();
router.use(
  authenticate,
  teacherContext,
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
);
router.get('/', validate(submissionListSchema), controller.list);
router.post('/', validate(submissionSaveSchema), controller.save);
router.patch('/:id/status', validate(submissionStatusSchema), controller.updateStatus);
export default router;

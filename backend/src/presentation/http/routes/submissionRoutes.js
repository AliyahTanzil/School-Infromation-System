import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import * as controller from '../controllers/submissionController.js';

const router = Router();
router.use(
  authenticate,
  teacherContext,
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
);
router.get('/', controller.list);
router.post('/', controller.save);
router.patch('/:id/status', controller.updateStatus);
export default router;

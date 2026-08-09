import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/classController.js';
import {
  classCreateSchema,
  classStatusSchema,
  classQuerySchema,
  enrollmentSchema,
} from '../../../application/validators/classValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/', validate(classQuerySchema), controller.list);
router.post('/', validate(classCreateSchema), controller.create);
router.patch('/:id/status', validate(classStatusSchema), controller.changeStatus);
router.post('/:id/enrollments', validate(enrollmentSchema), controller.enroll);
export default router;

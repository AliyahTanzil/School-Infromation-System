import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import authorize from '../../../middleware/auth/authorize.js';
import * as controller from '../controllers/teacherController.js';
import {
  teacherCreateSchema,
  teacherQuerySchema,
  teacherStatusSchema,
} from '../../../application/validators/teacherValidators.js';

const router = Router();
router.use(authenticate);
router.get('/me', authorize('TEACHER'), controller.me);
router.use(teacherContext);
router.get(
  '/',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  validate(teacherQuerySchema),
  controller.list
);
router.get('/:id', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), controller.get);
router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  validate(teacherCreateSchema),
  controller.create
);
router.patch(
  '/:id/status',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  validate(teacherStatusSchema),
  controller.changeStatus
);
export default router;

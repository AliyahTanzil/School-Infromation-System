import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import authorize from '../../../middleware/auth/authorize.js';
import * as controller from '../controllers/teacherController.js';
import {
  teacherCreateSchema,
  teacherIdSchema,
  teacherQuerySchema,
  teacherStatusSchema,
} from '../../../application/validators/teacherValidators.js';

const router = Router();
const administerTeachers = authorize(
  'PLATFORM_ADMIN',
  'SCHOOL_ADMIN',
  'APPLICATION_MANAGER',
  'OWNER'
);
router.use(authenticate);
router.use(teacherContext);
router.get('/me', authorize('TEACHER'), controller.me);
router.get('/', administerTeachers, validate(teacherQuerySchema), controller.list);
router.get('/:id', administerTeachers, validate(teacherIdSchema), controller.get);
router.post('/', administerTeachers, validate(teacherCreateSchema), controller.create);
router.patch(
  '/:id/status',
  administerTeachers,
  validate(teacherStatusSchema),
  controller.changeStatus
);
export default router;

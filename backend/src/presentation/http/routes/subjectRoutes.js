import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/subjectController.js';
import {
  subjectCreateSchema,
  subjectQuerySchema,
  subjectStatusSchema,
  subjectUpdateSchema,
} from '../../../application/validators/subjectValidators.js';

const router = Router();
router.use(
  authenticate,
  teacherContext,
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'APPLICATION_MANAGER', 'OWNER')
);
router.get('/', validate(subjectQuerySchema), controller.list);
router.post('/', validate(subjectCreateSchema), controller.create);
router.get('/:id', controller.get);
router.patch('/:id', validate(subjectUpdateSchema), controller.update);
router.patch('/:id/status', validate(subjectStatusSchema), controller.changeStatus);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/subjectController.js';
import {
  subjectCreateSchema,
  subjectIdSchema,
  subjectQuerySchema,
  subjectStatusSchema,
  subjectUpdateSchema,
} from '../../../application/validators/subjectValidators.js';

const router = Router();
const admin = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'APPLICATION_MANAGER', 'OWNER');
export function subjectAdmin(req, res, next) {
  if (req.user?.platformRole === 'OWNER') return next();
  return admin(req, res, next);
}
router.use(authenticate, teacherContext, subjectAdmin);
router.get('/', validate(subjectQuerySchema), controller.list);
router.post('/', validate(subjectCreateSchema), controller.create);
router.get('/:id', validate(subjectIdSchema), controller.get);
router.patch('/:id', validate(subjectUpdateSchema), controller.update);
router.delete('/:id', validate(subjectIdSchema), controller.remove);
router.patch('/:id/status', validate(subjectStatusSchema), controller.changeStatus);
export default router;

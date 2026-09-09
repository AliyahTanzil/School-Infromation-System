import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/resultController.js';
import {
  resultProcessSchema,
  resultQuerySchema,
  resultStatusSchema,
} from '../../../application/validators/resultValidators.js';
const router = Router();
const readResults = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER');
const administerResults = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');

router.use(authenticate, teacherContext);
router.get('/statistics', readResults, validate(resultQuerySchema), controller.statistics);
router.get('/', readResults, validate(resultQuerySchema), controller.list);
router.post('/process', administerResults, validate(resultProcessSchema), controller.process);
router.patch(
  '/:id/status',
  administerResults,
  validate(resultStatusSchema),
  controller.changeStatus
);
export default router;

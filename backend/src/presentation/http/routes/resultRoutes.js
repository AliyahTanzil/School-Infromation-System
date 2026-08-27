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
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));
router.get('/statistics', validate(resultQuerySchema), controller.statistics);
router.get('/', validate(resultQuerySchema), controller.list);
router.post('/process', validate(resultProcessSchema), controller.process);
router.patch('/:id/status', validate(resultStatusSchema), controller.changeStatus);
export default router;

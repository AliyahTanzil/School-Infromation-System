import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/attendanceController.js';
import {
  attendanceBulkSchema,
  attendanceQuerySchema,
  attendanceSessionCreateSchema,
  attendanceSessionIdSchema,
  attendanceSessionStatusSchema,
} from '../../../application/validators/attendanceValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));
router.get('/options', controller.options);
router.get('/', validate(attendanceQuerySchema), controller.list);
router.post('/', validate(attendanceSessionCreateSchema), controller.create);
router.get('/:id', validate(attendanceSessionIdSchema), controller.get);
router.patch('/:id/status', validate(attendanceSessionStatusSchema), controller.changeStatus);
router.post('/:id/records/bulk', validate(attendanceBulkSchema), controller.markBulk);
export default router;

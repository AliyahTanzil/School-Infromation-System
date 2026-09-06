import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/classroomLiveSessionController.js';
import {
  liveSessionQuerySchema,
  liveSessionCreateSchema,
  liveSessionStatusSchema,
  liveSessionParamsSchema,
} from '../../../application/validators/classroomLiveSessionValidators.js';

const router = Router();
router.use(authenticate, teacherContext);

router.get('/recordings', controller.listRecordings);
router.get('/', validate(liveSessionQuerySchema), controller.list);
router.get('/:id', validate(liveSessionParamsSchema), controller.get);
router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(liveSessionCreateSchema),
  controller.create
);
router.patch(
  '/:id/status',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(liveSessionStatusSchema),
  controller.updateStatus
);

export default router;

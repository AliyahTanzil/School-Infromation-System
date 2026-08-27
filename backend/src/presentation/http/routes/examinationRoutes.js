import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/examinationController.js';
import {
  examinationCandidateSchema,
  examinationCreateSchema,
  examinationMarkSchema,
  examinationQuerySchema,
  examinationScheduleSchema,
  examinationStatusSchema,
} from '../../../application/validators/examinationValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));
router.get('/', validate(examinationQuerySchema), controller.list);
router.post('/', validate(examinationCreateSchema), controller.create);
router.get('/:id', controller.get);
router.post('/:id/candidates', validate(examinationCandidateSchema), controller.addCandidate);
router.post('/:id/schedules', validate(examinationScheduleSchema), controller.addSchedule);
router.patch('/:id/status', validate(examinationStatusSchema), controller.changeStatus);
router.put('/:id/marks', validate(examinationMarkSchema), controller.upsertMark);
export default router;

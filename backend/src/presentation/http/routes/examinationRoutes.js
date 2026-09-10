import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/examinationController.js';
import {
  examinationCandidateSchema,
  examinationCreateSchema,
  examinationIdSchema,
  examinationMarkSchema,
  examinationQuerySchema,
  examinationScheduleSchema,
  examinationStatusSchema,
} from '../../../application/validators/examinationValidators.js';
const router = Router();
const readOrMark = authorizeSchoolAdminOrTeacher;
const administer = authorizeSchoolAdmin;

router.use(authenticate, teacherContext);
router.get('/', readOrMark, validate(examinationQuerySchema), controller.list);
router.post('/', administer, validate(examinationCreateSchema), controller.create);
router.get('/:id', readOrMark, validate(examinationIdSchema), controller.get);
router.post(
  '/:id/candidates',
  administer,
  validate(examinationCandidateSchema),
  controller.addCandidate
);
router.post(
  '/:id/schedules',
  administer,
  validate(examinationScheduleSchema),
  controller.addSchedule
);
router.patch('/:id/status', administer, validate(examinationStatusSchema), controller.changeStatus);
router.put('/:id/marks', readOrMark, validate(examinationMarkSchema), controller.upsertMark);
export default router;

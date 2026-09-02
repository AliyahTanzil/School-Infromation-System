import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/gradebookController.js';
import {
  feedbackSchema,
  gradeIdSchema,
  gradeListSchema,
  gradeSaveSchema,
  rubricCreateSchema,
  rubricListSchema,
  rubricStatusSchema,
} from '../../../application/validators/gradebookValidators.js';

const router = Router();
router.use(
  authenticate,
  teacherContext,
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
);
router.get('/rubrics', validate(rubricListSchema), controller.listRubrics);
router.post(
  '/rubrics',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(rubricCreateSchema),
  controller.createRubric
);
router.patch(
  '/rubrics/:id/status',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(rubricStatusSchema),
  controller.changeRubricStatus
);
router.get('/grades', validate(gradeListSchema), controller.listGrades);
router.put(
  '/submissions/:submissionId/grade',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(gradeSaveSchema),
  controller.saveGrade
);
router.post(
  '/grades/:id/release',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(gradeIdSchema),
  controller.releaseGrade
);
router.post('/grades/:id/feedback', validate(feedbackSchema), controller.addFeedback);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/gradebookController.js';
import {
  feedbackSchema,
  gradeIdSchema,
  gradeListSchema,
  gradeSaveSchema,
  rubricCreateSchema,
  rubricListSchema,
  rubricAssignmentSchema,
  rubricStatusSchema,
} from '../../../application/validators/gradebookValidators.js';

const router = Router();
const authorizeGradebookUser = (req, res, next) => {
  if (req.user?.roles?.includes('STUDENT')) return next();
  return authorizeSchoolAdminOrTeacher(req, res, next);
};
router.use(authenticate, teacherContext, authorizeGradebookUser);
router.get('/rubrics', validate(rubricListSchema), controller.listRubrics);
router.post(
  '/rubrics',
  authorizeSchoolAdminOrTeacher,
  validate(rubricCreateSchema),
  controller.createRubric
);
router.patch(
  '/rubrics/:id/status',
  authorizeSchoolAdminOrTeacher,
  validate(rubricStatusSchema),
  controller.changeRubricStatus
);
router.patch(
  '/assignments/:assignmentId/rubric',
  authorizeSchoolAdminOrTeacher,
  validate(rubricAssignmentSchema),
  controller.assignRubric
);
router.get('/grades', validate(gradeListSchema), controller.listGrades);
router.put(
  '/submissions/:submissionId/grade',
  authorizeSchoolAdminOrTeacher,
  validate(gradeSaveSchema),
  controller.saveGrade
);
router.post(
  '/grades/:id/release',
  authorizeSchoolAdminOrTeacher,
  validate(gradeIdSchema),
  controller.releaseGrade
);
router.post('/grades/:id/feedback', validate(feedbackSchema), controller.addFeedback);
export default router;

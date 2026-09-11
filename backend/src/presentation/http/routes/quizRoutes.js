import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/quizController.js';
import {
  quizAttemptAnswerSchema,
  quizAttemptIdSchema,
  quizCreateSchema,
  quizIdSchema,
  quizListSchema,
  quizQuestionSchema,
  quizStatusSchema,
} from '../../../application/validators/quizValidators.js';

const router = Router();
const authorizeQuizUser = (req, res, next) => {
  if (req.user?.roles?.includes('STUDENT')) return next();
  return authorizeSchoolAdminOrTeacher(req, res, next);
};
router.use(authenticate, teacherContext, authorizeQuizUser);
router.get('/', validate(quizListSchema), controller.list);
router.post('/', authorizeSchoolAdminOrTeacher, validate(quizCreateSchema), controller.create);
router.get('/:id', validate(quizIdSchema), controller.details);
router.post(
  '/:id/questions',
  authorizeSchoolAdminOrTeacher,
  validate(quizQuestionSchema),
  controller.addQuestion
);
router.patch(
  '/:id/status',
  authorizeSchoolAdminOrTeacher,
  validate(quizStatusSchema),
  controller.changeStatus
);
router.post('/:id/attempts', validate(quizIdSchema), controller.startAttempt);
router.put(
  '/attempts/:attemptId/answers',
  validate(quizAttemptAnswerSchema),
  controller.saveAnswer
);
router.post('/attempts/:attemptId/submit', validate(quizAttemptIdSchema), controller.submitAttempt);
export default router;

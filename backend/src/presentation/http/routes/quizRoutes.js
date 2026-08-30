import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
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
router.use(
  authenticate,
  teacherContext,
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
);
router.get('/', validate(quizListSchema), controller.list);
router.post(
  '/',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(quizCreateSchema),
  controller.create
);
router.get('/:id', validate(quizIdSchema), controller.details);
router.post(
  '/:id/questions',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(quizQuestionSchema),
  controller.addQuestion
);
router.patch(
  '/:id/status',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
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

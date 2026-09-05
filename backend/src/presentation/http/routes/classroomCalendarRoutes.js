import { Router } from 'express';
import { classroomCalendarQuerySchema } from '../../../application/validators/classroomCalendarValidators.js';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/classroomCalendarController.js';

const router = Router();
router.use(authenticate, teacherContext);
router.get('/', validate(classroomCalendarQuerySchema), controller.list);
export default router;

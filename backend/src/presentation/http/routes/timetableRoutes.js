import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/timetableController.js';
import {
  createTimetableSchema,
  entrySchema,
  statusSchema,
  substitutionSchema,
} from '../../../application/validators/timetableValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/', controller.list);
router.post('/', validate(createTimetableSchema), controller.create);
router.post('/:id/entries', validate(entrySchema), controller.addEntry);
router.patch('/:id/status', validate(statusSchema), controller.changeStatus);
router.post('/:id/substitutions', validate(substitutionSchema), controller.createSubstitution);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/resultController.js';
import {
  resultProcessSchema,
  resultQuerySchema,
  resultStatusSchema,
} from '../../../application/validators/resultValidators.js';
const router = Router();
const readResults = authorizeSchoolAdminOrTeacher;
const administerResults = authorizeSchoolAdmin;

router.use(authenticate, teacherContext);
router.get('/statistics', readResults, validate(resultQuerySchema), controller.statistics);
router.get('/', readResults, validate(resultQuerySchema), controller.list);
router.post('/process', administerResults, validate(resultProcessSchema), controller.process);
router.patch(
  '/:id/status',
  administerResults,
  validate(resultStatusSchema),
  controller.changeStatus
);
export default router;

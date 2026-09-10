import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/academicPolicyController.js';
import {
  academicPolicyCreateSchema,
  academicPolicyIdSchema,
  academicPolicyQuerySchema,
  academicPolicyStatusSchema,
} from '../../../application/validators/academicPolicyValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorizeSchoolAdmin);
router.get('/', validate(academicPolicyQuerySchema), controller.list);
router.post('/', validate(academicPolicyCreateSchema), controller.create);
router.get('/:id', validate(academicPolicyIdSchema), controller.get);
router.patch('/:id/status', validate(academicPolicyStatusSchema), controller.changeStatus);
export default router;

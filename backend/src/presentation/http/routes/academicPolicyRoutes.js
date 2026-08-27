import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/academicPolicyController.js';
import {
  academicPolicyCreateSchema,
  academicPolicyQuerySchema,
  academicPolicyStatusSchema,
} from '../../../application/validators/academicPolicyValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/', validate(academicPolicyQuerySchema), controller.list);
router.post('/', validate(academicPolicyCreateSchema), controller.create);
router.get('/:id', controller.get);
router.patch('/:id/status', validate(academicPolicyStatusSchema), controller.changeStatus);
export default router;

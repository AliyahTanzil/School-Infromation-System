import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/academicPeriodController.js';
import {
  academicPeriodQuerySchema,
  academicPeriodCreateSchema,
  academicPeriodStatusSchema,
} from '../../../application/validators/academicPeriodValidators.js';

const router = Router();
const admin = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');
router.use(authenticate, admin);
router.get('/', validate(academicPeriodQuerySchema), controller.list);
router.post('/', validate(academicPeriodCreateSchema), controller.create);
router.patch('/:id/status', validate(academicPeriodStatusSchema), controller.changeStatus);
export default router;

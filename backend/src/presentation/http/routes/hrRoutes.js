import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import authorize from '../../../middleware/auth/authorize.js';
import * as controller from '../controllers/hrController.js';
import validate from '../../../middleware/validation/validate.js';
import {
  employeeCreateSchema,
  employeeQuerySchema,
  leaveCreateSchema,
  leaveDecisionSchema,
  payrollCreateSchema,
  payrollParamsSchema,
} from '../../../application/validators/hrValidators.js';
const router = Router();
const admin = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');
export function hrAdmin(req, res, next) {
  if (req.user?.platformRole === 'OWNER') return next();
  return admin(req, res, next);
}
router.use(authenticate, teacherContext, hrAdmin);
router.get('/dashboard', controller.dashboard);
router.get('/employees', validate(employeeQuerySchema), controller.employees);
router.post('/employees', validate(employeeCreateSchema), controller.createEmployee);
router.get('/leave-requests', controller.leaveRequests);
router.post('/leave-requests', validate(leaveCreateSchema), controller.requestLeave);
router.patch('/leave-requests/:id', validate(leaveDecisionSchema), controller.approveLeave);
router.post('/payroll-runs', validate(payrollCreateSchema), controller.createPayroll);
router.post(
  '/payroll-runs/:id/finalize',
  validate(payrollParamsSchema),
  controller.finalizePayroll
);
export default router;

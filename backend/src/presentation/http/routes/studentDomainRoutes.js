import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import { requirePermission } from '../../../middleware/auth/authorization.js';
import * as controller from '../controllers/studentDomainController.js';

const router = Router();
router.use(authenticate, singleSchoolContext);
router.get('/', requirePermission('students.read'), controller.list);
router.get('/:id', requirePermission('students.read'), controller.get);
router.post('/', requirePermission('students.create'), controller.create);
router.patch('/:id', requirePermission('students.update'), controller.update);
router.post('/:id/guardians', requirePermission('students.update'), controller.addGuardian);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { requirePermission } from '../../../middleware/auth/authorization.js';
import * as controller from '../controllers/studentDomainController.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('student.read'), controller.list);
router.get('/:id', requirePermission('student.read'), controller.get);
router.post('/', requirePermission('student.create'), controller.create);
router.patch('/:id', requirePermission('student.update'), controller.update);
router.post('/:id/guardians', requirePermission('student.update'), controller.addGuardian);
export default router;

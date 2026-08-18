import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { requireTenantContext } from '../../../middleware/auth/authorization.js';
import * as controller from '../controllers/accountController.js';

const router = Router();
router.use(authenticate);
router.get('/me', controller.me);
router.patch('/me', controller.updateProfile);
router.use(requireTenantContext);
router.get('/users', controller.listUsers);
router.patch('/users/:id', controller.updateUser);
router.post('/users/:id/status', controller.changeStatus);
router.post('/users/:id/roles', controller.assignRole);
router.delete('/users/:id/roles', controller.revokeRole);
export default router;

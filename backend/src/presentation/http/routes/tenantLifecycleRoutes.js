import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { requirePlatformOwner } from '../../../middleware/auth/authorization.js';
import * as controller from '../controllers/tenantLifecycleController.js';

const router = Router();
router.use(authenticate, requirePlatformOwner);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.post('/:id/status', controller.changeStatus);
router.put('/:id/features/:key', controller.setFeature);
router.post('/:id/schools', controller.createSchool);
export default router;

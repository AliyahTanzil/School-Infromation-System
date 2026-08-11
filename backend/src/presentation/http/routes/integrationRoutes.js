import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as controller from '../controllers/integrationController.js';
const router = Router();
router.use(authenticate);
router.get('/', controller.list);
router.post('/:providerKey/configure', controller.configure);
router.post('/:providerKey/health', controller.health);
export default router;

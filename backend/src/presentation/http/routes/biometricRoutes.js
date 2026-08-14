import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as controller from '../controllers/biometricController.js';

const router = Router();
router.use(authenticate);
router.get('/devices', controller.list);
router.post('/devices', controller.register);
router.post('/devices/:deviceId/health', controller.health);
router.post('/verifications', controller.verify);
export default router;

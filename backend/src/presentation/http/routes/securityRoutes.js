import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as controller from '../controllers/securityController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', controller.overview);
router.get('/events', controller.events);
router.get('/audit', controller.audit);
export default router;

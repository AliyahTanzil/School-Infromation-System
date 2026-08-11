import { Router } from 'express';
import { overview, action } from '../controllers/platformAdminController.js';
import authenticate from '../../../middleware/auth/authenticate.js';
import requirePlatformPermission from '../../../middleware/auth/requirePlatformPermission.js';

const router = Router();
router.use(authenticate, requirePlatformPermission());
router.get('/overview', overview);
router.post('/actions', action);
export default router;

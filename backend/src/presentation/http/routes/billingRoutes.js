import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { getOverview, lifecycle, webhook } from '../controllers/billingController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', getOverview);
router.post('/lifecycle', lifecycle);
router.post('/webhooks/:provider', webhook);
export default router;

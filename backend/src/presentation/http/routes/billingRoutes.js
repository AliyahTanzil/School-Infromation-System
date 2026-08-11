import { Router } from 'express';
import { getOverview, lifecycle, webhook } from '../controllers/billingController.js';

const router = Router();
router.get('/overview', getOverview);
router.post('/lifecycle', lifecycle);
router.post('/webhooks/:provider', webhook);
export default router;

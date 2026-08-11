import { Router } from 'express';
import { getOverview, lifecycle } from '../controllers/billingController.js';

const router = Router();
router.get('/overview', getOverview);
router.post('/lifecycle', lifecycle);
export default router;

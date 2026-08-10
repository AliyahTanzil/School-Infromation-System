import { Router } from 'express';
import { overview, kpis } from '../controllers/analyticsController.js';

const router = Router();
router.get('/overview', overview);
router.get('/kpis', kpis);
export default router;

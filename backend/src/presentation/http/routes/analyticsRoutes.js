import { Router } from 'express';
import { exportReport, kpi, kpis, overview } from '../controllers/analyticsController.js';

const router = Router();
router.get('/overview', overview);
router.get('/kpis', kpis);
router.get('/kpis/:metricKey', kpi);
router.post('/exports', exportReport);
export default router;

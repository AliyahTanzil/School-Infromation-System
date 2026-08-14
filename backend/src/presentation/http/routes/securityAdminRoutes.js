import { Router } from 'express';
import { overview, risk, revoke } from '../controllers/securityAdminController.js';

const router = Router();
router.get('/overview', overview);
router.post('/risk/evaluate', risk);
router.post('/sessions/:sessionId/revoke', revoke);
export default router;

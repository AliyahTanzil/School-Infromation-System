import { Router } from 'express';
import { overview, ask } from '../controllers/aiIntelligenceController.js';

const router = Router();
router.get('/overview', overview);
router.post('/ask', ask);
export default router;

import { Router } from 'express';
import { ask, overview, usage } from '../controllers/aiAcademicController.js';

const router = Router();
router.get('/overview', overview);
router.post('/ask', ask);
router.get('/usage', usage);
export default router;

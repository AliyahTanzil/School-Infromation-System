import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const router = Router();

// ─── System health probes ──────────────────────────────────────────────────────
router.use('/', healthRoutes);

export default router;

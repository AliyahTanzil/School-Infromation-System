import { Router } from 'express';
import documentationRoutes from './documentationRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

// ─── System health probes ──────────────────────────────────────────────────────
router.use('/', healthRoutes);
router.use('/', documentationRoutes);

export default router;

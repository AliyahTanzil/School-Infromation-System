import { Router } from 'express';
import documentationRoutes from './documentationRoutes.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

const router = Router();

// ─── System health probes ──────────────────────────────────────────────────────
router.use('/', healthRoutes);
router.use('/', documentationRoutes);
router.use('/auth', authRoutes);

export default router;

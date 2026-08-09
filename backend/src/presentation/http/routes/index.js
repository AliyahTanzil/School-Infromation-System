import { Router } from 'express';
import documentationRoutes from './documentationRoutes.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';
import userRoutes from './userRoutes.js';
import schoolRoutes from './schoolRoutes.js';
import studentRoutes from './studentRoutes.js';
import parentRoutes from './parentRoutes.js';

const router = Router();

// ─── System health probes ──────────────────────────────────────────────────────
router.use('/', healthRoutes);
router.use('/', documentationRoutes);
router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/students', studentRoutes);
router.use('/parents', parentRoutes);

export default router;

import { Router } from 'express';
import documentationRoutes from './documentationRoutes.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';
import userRoutes from './userRoutes.js';
import schoolRoutes from './schoolRoutes.js';
import studentRoutes from './studentRoutes.js';
import parentRoutes from './parentRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import classRoutes from './classRoutes.js';
import financeRoutes from './financeRoutes.js';
import financeCoreRoutes from './financeCoreRoutes.js';
import paymentGatewayRoutes from './paymentGatewayRoutes.js';
import academicPeriodRoutes from './academicPeriodRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import examinationRoutes from './examinationRoutes.js';
import resultRoutes from './resultRoutes.js';
import timetableRoutes from './timetableRoutes.js';

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
router.use('/teachers', teacherRoutes);
router.use('/classes', classRoutes);
router.use('/finance', financeRoutes);
router.use('/finance/core', financeCoreRoutes);
router.use('/payment-gateway', paymentGatewayRoutes);
router.use('/academic-periods', academicPeriodRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/examinations', examinationRoutes);
router.use('/results', resultRoutes);
router.use('/timetables', timetableRoutes);

export default router;

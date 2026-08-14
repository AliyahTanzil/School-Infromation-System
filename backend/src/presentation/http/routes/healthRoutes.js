/**
 * Health Routes
 *
 * Mounts the three-tier health check endpoints:
 *
 *   GET /health  — full system status (DB + metrics)     → for dashboards/alerting
 *   GET /ready   — readiness probe                        → Kubernetes / ECS / load-balancer
 *   GET /live    — liveness probe                         → Kubernetes / process monitor
 *
 * All routes bypass authentication middleware intentionally:
 * probes must be answerable even before the auth layer initialises.
 */

import { Router } from 'express';
import { getHealth, getReady, getLive, getDeepHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/health/deep', getDeepHealth);
router.get('/ready', getReady);
router.get('/live', getLive);

export default router;

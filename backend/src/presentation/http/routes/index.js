import { Router } from 'express';

const router = Router();

// Health-check — confirms the server is alive and reachable.
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import validate from '../../../middleware/validation/validate.js';
import { z } from 'zod';
import {
  readSmtpSettings,
  safeSettings,
  saveSmtpSettings,
  smtpSchema,
} from '../../../infrastructure/email/smtpSettings.js';

const router = Router();
router.use(authenticate, singleSchoolContext, requirePermission('schools.update'));
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
router.get('/', async (req, res) => {
  const { settings, source, updatedAt } = await readSmtpSettings(req.schoolContext.tenantId);
  res.json({ success: true, data: safeSettings(settings, source, updatedAt) });
});
router.put(
  '/',
  rateLimit({ windowMs: 60000, limit: 5, standardHeaders: true, legacyHeaders: false }),
  validate(z.object({ body: smtpSchema })),
  async (req, res) => {
    const data = await saveSmtpSettings(req.schoolContext.tenantId, req.user.id, req.body);
    res.json({ success: true, data });
  }
);
export default router;

import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import service from '../../../application/services/communicationService.js';
import {
  notificationCreateSchema,
  notificationParamsSchema,
  notificationQuerySchema,
  preferenceSchema,
} from '../../../application/validators/communicationValidators.js';
const router = Router();
router.use(authenticate, teacherContext);
router.get('/inbox', validate(notificationQuerySchema), async (req, res) =>
  res.json({
    data: await service.inbox(req.schoolContext, req.user.id, req.validatedQuery ?? req.query),
  })
);
router.get('/notifications/unread-count', async (req, res) =>
  res.json({ data: { count: await service.unreadCount(req.schoolContext, req.user.id) } })
);
router.post(
  '/notifications/:notificationId/read',
  validate(notificationParamsSchema),
  async (req, res) =>
    res.json({
      data: await service.markRead(req.schoolContext, req.params.notificationId, req.user.id),
    })
);
router.get('/notification-preferences', async (req, res) =>
  res.json({ data: await service.getPreferences(req.schoolContext, req.user.id) })
);
router.put('/notification-preferences', validate(preferenceSchema), async (req, res) =>
  res.json({ data: await service.upsertPreference(req.schoolContext, req.user.id, req.body) })
);
router.get(
  '/notifications',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  validate(notificationQuerySchema),
  async (req, res) =>
    res.json({
      data: await service.listNotifications(req.schoolContext, req.validatedQuery ?? req.query),
    })
);
router.post(
  '/notifications',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  validate(notificationCreateSchema),
  async (req, res) =>
    res.status(201).json({ data: await service.createNotification(req.schoolContext, req.body) })
);
router.get(
  '/notification-delivery-health',
  authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'),
  async (req, res) => res.json({ data: await service.deliveryHealth(req.schoolContext) })
);
export default router;

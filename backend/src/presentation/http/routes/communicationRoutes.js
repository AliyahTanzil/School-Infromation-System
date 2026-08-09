import { Router } from 'express';
import communicationService from '../../../application/services/communicationService.js';

const router = Router();

router.get('/notifications', async (req, res, next) => {
  try {
    res.json({ data: await communicationService.listNotifications(req.query) });
  } catch (error) {
    next(error);
  }
});
router.get('/notifications/unread-count', async (req, res, next) => {
  try {
    res.json({ data: { count: await communicationService.unreadCount(req.query.userId) } });
  } catch (error) {
    next(error);
  }
});
router.post('/notifications', async (req, res, next) => {
  try {
    res.status(201).json({ data: await communicationService.createNotification(req.body) });
  } catch (error) {
    next(error);
  }
});
router.post('/notifications/:notificationId/read', async (req, res, next) => {
  try {
    res.json({
      data: await communicationService.markRead(req.params.notificationId, req.body.userId),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

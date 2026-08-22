import { Router } from 'express';
import paymentGatewayService from '../../../application/services/paymentGatewayService.js';

const router = Router();
router.get('/health', async (_req, res, next) => {
  try {
    res.json({ data: await paymentGatewayService.health() });
  } catch (error) {
    next(error);
  }
});
router.get('/intents', async (req, res, next) => {
  try {
    res.json({ data: await paymentGatewayService.list(req.query) });
  } catch (error) {
    next(error);
  }
});
router.post('/intents', async (req, res, next) => {
  try {
    res.status(201).json({ data: await paymentGatewayService.createIntent(req.body) });
  } catch (error) {
    next(error);
  }
});
router.post('/intents/:id/initialize', async (req, res, next) => {
  try {
    res.json({ data: await paymentGatewayService.initialize(req.params.id) });
  } catch (error) {
    next(error);
  }
});
router.post('/webhooks/:provider', async (req, res, next) => {
  try {
    res.json({
      data: await paymentGatewayService.webhook({ ...req.body, providerId: req.params.provider, signature: req.get('x-monime-signature') || req.get('x-webhook-signature'), rawBody: JSON.stringify(req.body) }),
    });
  } catch (error) {
    next(error);
  }
});
export default router;

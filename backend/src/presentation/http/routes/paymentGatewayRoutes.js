import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import paymentGatewayService from '../../../application/services/paymentGatewayService.js';
import {
  intentCreateSchema,
  intentParamsSchema,
  intentQuerySchema,
} from '../../../application/validators/paymentGatewayValidators.js';
const router = Router();
export async function monimeWebhookHandler(req, res) {
  const data = await paymentGatewayService.webhook({
    payload: req.body,
    eventId: req.body?.id || req.get('x-monime-event-id'),
    eventType: req.body?.type,
    signature: req.get('monime-signature'),
    rawBody: req.rawBody || JSON.stringify(req.body),
  });
  res.json({ data });
}
router.post('/webhook', monimeWebhookHandler);
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/health', async (_req, res) =>
  res.json({ data: await paymentGatewayService.health() })
);
router.get('/intents', validate(intentQuerySchema), async (req, res) =>
  res.json({
    data: await paymentGatewayService.list(req.schoolContext, req.validatedQuery ?? req.query),
  })
);
router.post('/intents', validate(intentCreateSchema), async (req, res) =>
  res
    .status(201)
    .json({ data: await paymentGatewayService.createIntent(req.schoolContext, req.body) })
);
router.post('/intents/:id/initialize', validate(intentParamsSchema), async (req, res) =>
  res.json({ data: await paymentGatewayService.initialize(req.params.id, req.schoolContext) })
);
export default router;

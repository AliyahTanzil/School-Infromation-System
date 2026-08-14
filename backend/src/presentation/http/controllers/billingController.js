import {
  getBillingOverview,
  processWebhook,
  requestLifecycle,
} from '../../../application/services/billingService.js';

export async function getOverview(req, res, next) {
  try {
    res.json({ data: await getBillingOverview({ tenantId: req.auth?.tenantId }) });
  } catch (error) {
    next(error);
  }
}

export async function lifecycle(req, res, next) {
  try {
    const data = await requestLifecycle({
      tenantId: req.auth?.tenantId,
      actorId: req.auth?.userId,
      action: req.body?.action,
      planKey: req.body?.planKey,
    });
    res.status(202).json({ data });
  } catch (error) {
    next(error);
  }
}

export async function webhook(req, res, next) {
  try {
    const data = await processWebhook({
      provider: req.params.provider,
      eventKey: req.get('x-event-key'),
      payload: req.body,
    });
    res.status(data.duplicate ? 200 : 202).json({ data });
  } catch (error) {
    next(error);
  }
}

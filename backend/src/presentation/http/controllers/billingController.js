import {
  getBillingOverview,
  validateLifecycleAction,
} from '../../../application/services/billingService.js';

export function getOverview(req, res) {
  res.json({
    data: getBillingOverview({ tenantId: req.auth?.tenantId, demo: req.query.demo === 'true' }),
  });
}

export function lifecycle(req, res) {
  try {
    const action = validateLifecycleAction(req.body?.action);
    res
      .status(202)
      .json({ data: { action, status: 'queued', message: 'Billing change queued for review.' } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

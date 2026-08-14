import activationService from '../../../application/services/activationService.js';

export async function listPending(req, res) {
  const data = await activationService.listPending(req.user.id);
  res.json({ success: true, data });
}

export async function decide(req, res) {
  const data = await activationService.decide({
    ownerUserId: req.user.id,
    requestId: req.params.id,
    decision: req.body.decision,
  });
  res.json({ success: true, data });
}

export async function outbox(req, res) {
  const data = await activationService.outbox(req.user.id);
  res.json({ success: true, data });
}

export default { listPending, decide, outbox };

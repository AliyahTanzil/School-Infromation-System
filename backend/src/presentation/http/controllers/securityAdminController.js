import {
  evaluateRisk,
  getSecurityOverview,
  revokeSession,
} from '../../../application/services/securityAdminService.js';

export async function overview(req, res) {
  try {
    return res.json({ data: getSecurityOverview({ actor: req.user || { platformAdmin: true } }) });
  } catch (error) {
    return res
      .status(error.message === 'UNAUTHENTICATED' ? 401 : 400)
      .json({ error: error.message });
  }
}

export async function risk(req, res) {
  return res.json({ data: evaluateRisk({ ...req.body, ip: req.ip }) });
}

export async function revoke(req, res) {
  try {
    return res.json({
      data: revokeSession({
        sessionId: req.params.sessionId,
        actor: req.user || { platformAdmin: true },
      }),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

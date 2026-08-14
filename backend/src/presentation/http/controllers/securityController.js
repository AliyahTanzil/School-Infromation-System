import * as securityService from '../../../application/services/securityService.js';

function scope(req) {
  return { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
}
export async function overview(req, res, next) {
  try {
    res.json(await securityService.getSecurityOverview(scope(req)));
  } catch (error) {
    next(error);
  }
}
export async function events(req, res, next) {
  try {
    res.json(await securityService.listSecurityEvents(scope(req)));
  } catch (error) {
    next(error);
  }
}
export async function audit(req, res, next) {
  try {
    res.json(await securityService.listAuditLogs(scope(req)));
  } catch (error) {
    next(error);
  }
}

import * as service from '../../../application/services/attendanceService.js';

function context(req) {
  return {
    tenantId: req.schoolContext.tenantId,
    schoolId: req.schoolContext.schoolId,
    actorId: req.user.id,
    roles: req.user.roles,
    platformRole: req.user.platformRole,
  };
}
export async function list(req, res) {
  res.json(await service.listSessions({ ...(req.validatedQuery ?? req.query), ...context(req) }));
}
export async function options(req, res) {
  res.json({ classes: await service.attendanceOptions(context(req)) });
}
export async function create(req, res) {
  res.status(201).json(await service.createSession({ ...req.body, ...context(req) }));
}
export async function get(req, res) {
  res.json(await service.getSession({ ...context(req), id: req.params.id }));
}
export async function changeStatus(req, res) {
  res.json(await service.changeStatus({ ...req.body, ...context(req), id: req.params.id }));
}
export async function markBulk(req, res) {
  res.json(await service.markBulk({ ...req.body, ...context(req), id: req.params.id }));
}

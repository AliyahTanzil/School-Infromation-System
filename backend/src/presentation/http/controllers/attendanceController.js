import * as service from '../../../application/services/attendanceService.js';

function context(req) {
  return {
    tenantId: req.schoolContext.tenantId,
    schoolId: req.schoolContext.schoolId,
    actorId: req.user.id,
    roles: req.user.roles,
  };
}
export async function list(req, res) {
  res.json(await service.listSessions({ ...context(req), ...(req.validatedQuery ?? req.query) }));
}
export async function options(req, res) {
  res.json({ classes: await service.attendanceOptions(context(req)) });
}
export async function create(req, res) {
  res.status(201).json(await service.createSession({ ...context(req), ...req.body }));
}
export async function get(req, res) {
  res.json(await service.getSession({ ...context(req), id: req.params.id }));
}
export async function changeStatus(req, res) {
  res.json(await service.changeStatus({ ...context(req), id: req.params.id, ...req.body }));
}
export async function markBulk(req, res) {
  res.json(await service.markBulk({ ...context(req), id: req.params.id, ...req.body }));
}

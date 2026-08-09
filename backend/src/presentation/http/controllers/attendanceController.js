import * as service from '../../../application/services/attendanceService.js';

function context(req) {
  return { tenantId: req.auth.tenantId, schoolId: req.auth.schoolId, actorId: req.auth.userId };
}
export async function list(req, res) {
  res.json(await service.listSessions({ ...context(req), ...req.query }));
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

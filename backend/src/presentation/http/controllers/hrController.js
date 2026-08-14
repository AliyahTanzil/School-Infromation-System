import * as service from '../../../application/services/hrService.js';
function context(req) {
  return { tenantId: req.auth.tenantId, schoolId: req.auth.schoolId, actorId: req.auth.userId };
}
export async function dashboard(req, res) {
  res.json(await service.dashboard(context(req)));
}
export async function employees(req, res) {
  res.json(await service.listEmployees({ ...context(req), ...req.query }));
}
export async function createEmployee(req, res) {
  res.status(201).json(await service.createEmployee({ ...context(req), ...req.body }));
}
export async function requestLeave(req, res) {
  res.status(201).json(await service.requestLeave({ ...context(req), ...req.body }));
}
export async function approveLeave(req, res) {
  res.json(
    await service.approveLeave({
      ...context(req),
      id: req.params.id,
      approvedById: req.auth.userId,
      ...req.body,
    })
  );
}

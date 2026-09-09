import * as service from '../../../application/services/hrService.js';
function context(req) {
  return {
    tenantId: req.schoolContext.tenantId,
    schoolId: req.schoolContext.schoolId,
    actorId: req.user.id,
  };
}
export async function dashboard(req, res) {
  res.json({ data: await service.dashboard(context(req)) });
}
export async function employees(req, res) {
  res.json({
    data: await service.listEmployees({ ...(req.validatedQuery ?? req.query), ...context(req) }),
  });
}
export async function createEmployee(req, res) {
  res.status(201).json({ data: await service.createEmployee(context(req), req.body) });
}
export async function requestLeave(req, res) {
  res.status(201).json({ data: await service.requestLeave(context(req), req.body) });
}
export async function approveLeave(req, res) {
  res.json({
    data: await service.approveLeave({
      status: req.body.status,
      ...context(req),
      id: req.params.id,
      approvedById: req.user.id,
    }),
  });
}
export async function leaveRequests(req, res) {
  res.json({ data: await service.listLeaveRequests(context(req)) });
}
export async function createPayroll(req, res) {
  res.status(201).json({ data: await service.createPayrollRun(context(req), req.body) });
}
export async function finalizePayroll(req, res) {
  res.json({ data: await service.finalizePayrollRun(context(req), req.params.id) });
}

import * as service from '../../../application/services/teacherService.js';

export async function list(req, res) {
  res.json({ data: await service.list(req.schoolContext, req.validatedQuery ?? req.query) });
}
export async function get(req, res) {
  const data = await service.get(req.params.id, req.schoolContext);
  if (!data) return res.status(404).json({ message: 'Teacher not found' });
  return res.json({ data });
}
export async function me(req, res) {
  res.json({ data: await service.getMe(req.user.id, req.schoolContext) });
}
export async function create(req, res) {
  res.status(201).json({ data: await service.create(req.body, req.schoolContext) });
}
export async function changeStatus(req, res) {
  res.json({ data: await service.changeStatus(req.params.id, req.body, req.schoolContext) });
}

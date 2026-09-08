import * as service from '../../../application/services/subjectService.js';

export const list = async (req, res) =>
  res.json({ data: await service.list(req.schoolContext, req.validatedQuery ?? req.query) });
export const get = async (req, res) =>
  res.json({ data: await service.get(req.params.id, req.schoolContext) });
export const create = async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.schoolContext) });
export const update = async (req, res) =>
  res.json({ data: await service.update(req.params.id, req.body, req.schoolContext) });
export const changeStatus = async (req, res) =>
  res.json({ data: await service.changeStatus(req.params.id, req.body.status, req.schoolContext) });
export const remove = async (req, res) => {
  await service.remove(req.params.id, req.schoolContext);
  res.status(204).end();
};

import * as service from '../../../application/services/academicPolicyService.js';
export const list = async (req, res) =>
  res.json({ data: await service.list(req.schoolContext, req.validatedQuery ?? req.query) });
export const get = async (req, res) =>
  res.json({ data: await service.get(req.params.id, req.schoolContext) });
export const create = async (req, res) =>
  res.status(201).json({ data: await service.create(req.body, req.schoolContext) });
export const changeStatus = async (req, res) =>
  res.json({ data: await service.changeStatus(req.params.id, req.body, req.schoolContext) });

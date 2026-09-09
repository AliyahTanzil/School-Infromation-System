import * as service from '../../../application/services/examinationService.js';
export const list = async (req, res) =>
  res.json({
    data: await service.listExaminations(req.schoolContext, req.validatedQuery ?? req.query),
  });
export const create = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.createExamination(req.schoolContext, req.body, req.user.id) });
export const get = async (req, res) =>
  res.json({ data: await service.getExamination(req.params.id, req.schoolContext) });
export const addCandidate = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.addCandidate(req.params.id, req.schoolContext, req.body) });
export const addSchedule = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.addSchedule(req.params.id, req.schoolContext, req.body) });
export const changeStatus = async (req, res) =>
  res.json({
    data: await service.changeStatus(req.params.id, req.schoolContext, req.body, req.user.id),
  });
export const upsertMark = async (req, res) =>
  res.json({
    data: await service.upsertMark(
      req.params.id,
      req.schoolContext,
      req.body,
      req.user.id,
      req.user.roles
    ),
  });

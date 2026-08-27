import * as service from '../../../application/services/resultService.js';
export const list = async (req, res) =>
  res.json({
    data: await service.listResults(
      req.schoolContext,
      (req.validatedQuery ?? req.query).examinationId
    ),
  });
export const statistics = async (req, res) =>
  res.json({
    data: await service.getStatistics(
      req.schoolContext,
      (req.validatedQuery ?? req.query).examinationId
    ),
  });
export const process = async (req, res) =>
  res
    .status(201)
    .json({ data: await service.processResults(req.schoolContext, req.body, req.user.id) });
export const changeStatus = async (req, res) =>
  res.json({
    data: await service.changeStatus(
      req.params.id,
      req.schoolContext,
      req.body.status,
      req.user.id
    ),
  });

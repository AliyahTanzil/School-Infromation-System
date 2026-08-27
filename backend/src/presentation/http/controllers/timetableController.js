import * as service from '../../../application/services/timetableService.js';
export const list = async (req, res) =>
  res.json({ data: await service.listTimetables(req.schoolContext) });
export const create = async (req, res) =>
  res.status(201).json({
    data: await service.createTimetable({
      ...req.schoolContext,
      actorId: req.user.id,
      ...req.body,
    }),
  });
export const addEntry = async (req, res) =>
  res.status(201).json({
    data: await service.addEntry({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
      data: req.body,
    }),
  });
export const changeStatus = async (req, res) =>
  res.json({
    data: await service.changeStatus({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
      status: req.body.status,
    }),
  });
export const createSubstitution = async (req, res) =>
  res.status(201).json({
    data: await service.createSubstitution({
      ...req.schoolContext,
      timetableId: req.params.id,
      createdBy: req.user.id,
      ...req.body,
    }),
  });

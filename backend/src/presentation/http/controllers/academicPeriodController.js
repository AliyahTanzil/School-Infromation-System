import academicPeriodService from '../../../application/services/academicPeriodService.js';

export default {
  list: async (req, res) =>
    res.json({
      data: await academicPeriodService.listAcademicPeriods({
        ...(req.validatedQuery ?? req.query),
        ...req.schoolContext,
      }),
    }),
  create: async (req, res) =>
    res.status(201).json({
      data: await academicPeriodService.createAcademicPeriod({
        ...req.schoolContext,
        actorId: req.user.id,
        data: req.body,
      }),
    }),
  createEvent: async (req, res) =>
    res.status(201).json({
      data: await academicPeriodService.createAcademicEvent({
        ...req.schoolContext,
        actorId: req.user.id,
        data: req.body,
      }),
    }),
  changeStatus: async (req, res) =>
    res.json({
      data: await academicPeriodService.changeAcademicPeriodStatus({
        ...req.body,
        ...req.schoolContext,
        actorId: req.user.id,
        id: req.params.id,
      }),
    }),
};

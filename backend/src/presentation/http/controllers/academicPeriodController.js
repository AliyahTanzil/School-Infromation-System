import academicPeriodService from '../../../application/services/academicPeriodService.js';

export default {
  list: async (req, res) =>
    res.json({
      data: await academicPeriodService.listAcademicPeriods({
        tenantId: req.context.tenantId,
        schoolId: req.context.schoolId,
        ...req.query,
      }),
    }),
  create: async (req, res) =>
    res.status(201).json({
      data: await academicPeriodService.createAcademicPeriod({
        tenantId: req.context.tenantId,
        schoolId: req.context.schoolId,
        actorId: req.user.id,
        data: req.body,
      }),
    }),
  changeStatus: async (req, res) =>
    res.json({
      data: await academicPeriodService.changeAcademicPeriodStatus({
        tenantId: req.context.tenantId,
        schoolId: req.context.schoolId,
        actorId: req.user.id,
        id: req.params.id,
        ...req.body,
      }),
    }),
};

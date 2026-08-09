import * as service from '../../../application/services/classService.js';

const context = (req) => ({
  tenantId: req.auth?.tenantId || req.user?.tenantId,
  schoolId: req.auth?.schoolId || req.user?.schoolId,
});
export async function list(req, res, next) {
  try {
    res.json({ success: true, data: await service.list({ ...context(req), ...req.query }) });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res
      .status(201)
      .json({ success: true, data: await service.create({ ...context(req), ...req.body }) });
  } catch (error) {
    next(error);
  }
}
export async function changeStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.changeStatus({
        ...context(req),
        actorId: req.user?.id,
        id: req.params.id,
        ...req.body,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function enroll(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.enroll({
        ...context(req),
        classId: req.params.id,
        studentId: req.body.studentId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

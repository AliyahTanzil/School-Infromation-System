import * as service from '../../../application/services/classService.js';

const context = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list({ ...(req.validatedQuery ?? req.query), ...context(req) }),
    });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res
      .status(201)
      .json({ success: true, data: await service.create({ ...req.body, ...context(req) }) });
  } catch (error) {
    next(error);
  }
}
export async function get(req, res, next) {
  try {
    res.json({ success: true, data: await service.get({ ...context(req), id: req.params.id }) });
  } catch (error) {
    next(error);
  }
}
export async function addSubject(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.addSubject({
        ...req.body,
        ...context(req),
        classId: req.params.id,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function changeStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.changeStatus({
        ...req.body,
        ...context(req),
        actorId: req.user?.id,
        id: req.params.id,
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

export async function options(req, res) {
  res.json({ data: await service.options(context(req)) });
}

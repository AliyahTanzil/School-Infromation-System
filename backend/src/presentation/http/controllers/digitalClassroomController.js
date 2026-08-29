import * as service from '../../../application/services/digitalClassroomService.js';

const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});
const identity = (req) => ({ userId: req.user.id, roles: req.user.roles ?? [] });

export async function list(req, res, next) {
  try {
    const { userId, roles } = identity(req);
    res.json({ success: true, data: await service.list(scope(req), userId, roles) });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create(scope(req), req.user.id, req.body),
    });
  } catch (error) {
    next(error);
  }
}
export async function details(req, res, next) {
  try {
    const { userId, roles } = identity(req);
    res.json({
      success: true,
      data: await service.details(scope(req), req.params.classroomId, userId, roles),
    });
  } catch (error) {
    next(error);
  }
}
export async function addMember(req, res, next) {
  try {
    const { userId, roles } = identity(req);
    res.status(201).json({
      success: true,
      data: await service.addMember(scope(req), req.params.classroomId, userId, roles, req.body),
    });
  } catch (error) {
    next(error);
  }
}
export async function removeMember(req, res, next) {
  try {
    const { userId, roles } = identity(req);
    res.json({
      success: true,
      data: await service.removeMember(
        scope(req),
        req.params.classroomId,
        userId,
        roles,
        req.params.userId
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function archive(req, res, next) {
  try {
    const { userId, roles } = identity(req);
    res.json({
      success: true,
      data: await service.archive(scope(req), req.params.classroomId, userId, roles),
    });
  } catch (error) {
    next(error);
  }
}

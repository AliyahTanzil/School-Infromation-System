import * as service from '../../../application/services/classroomLiveSessionService.js';

const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });

export async function list(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    res.json({
      success: true,
      data: await service.list(
        req.schoolContext,
        query.classroomId,
        req.user.id,
        access(req),
        query.status
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function listRecordings(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.listRecordings(req.schoolContext, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create(req.schoolContext, req.user.id, access(req), req.body),
    });
  } catch (error) {
    next(error);
  }
}

export async function get(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.get(req.schoolContext, req.params.id, req.user.id, access(req)),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.updateStatus(
        req.schoolContext,
        req.params.id,
        req.user.id,
        access(req),
        req.body.status,
        req.body
      ),
    });
  } catch (error) {
    next(error);
  }
}

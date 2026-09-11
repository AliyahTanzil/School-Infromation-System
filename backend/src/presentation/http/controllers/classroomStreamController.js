import * as service from '../../../application/services/classroomStreamService.js';

const access = (req) => ({ roles: req.user.roles ?? [], platformRole: req.user.platformRole });
const context = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
});

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.listStream(
        context(req),
        req.params.classroomId,
        req.user.id,
        access(req)
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function announce(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.createAnnouncement(
        context(req),
        req.params.classroomId,
        req.user.id,
        access(req),
        req.body
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function post(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.createPost(
        context(req),
        req.params.classroomId,
        req.user.id,
        access(req),
        req.body
      ),
    });
  } catch (error) {
    next(error);
  }
}
export async function comment(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.addComment(
        context(req),
        req.params.postId,
        req.user.id,
        access(req),
        req.body.body
      ),
    });
  } catch (error) {
    next(error);
  }
}

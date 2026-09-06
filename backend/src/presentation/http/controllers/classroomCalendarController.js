import * as service from '../../../application/services/classroomCalendarService.js';

export async function list(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    res.json({
      success: true,
      data: await service.list(
        req.schoolContext,
        query.classroomId,
        req.user.id,
        req.user.roles ?? [],
        query.start,
        query.end
      ),
    });
  } catch (error) {
    next(error);
  }
}

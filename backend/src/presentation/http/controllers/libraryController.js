import * as service from '../../../application/services/libraryService.js';

function context(req) {
  return {
    schoolId: req.user?.schoolId || req.schoolId,
    libraryId: req.params.libraryId || req.query.libraryId,
  };
}

export async function overview(req, res, next) {
  try {
    res.json(await service.getLibraryOverview(context(req)));
  } catch (error) {
    next(error);
  }
}
export async function books(req, res, next) {
  try {
    res.json(
      await service.searchBooks({
        ...context(req),
        query: req.query.q,
        page: Number(req.query.page || 1),
      })
    );
  } catch (error) {
    next(error);
  }
}
export async function loans(req, res, next) {
  try {
    res.json(await service.listLoans({ ...context(req), status: req.query.status }));
  } catch (error) {
    next(error);
  }
}

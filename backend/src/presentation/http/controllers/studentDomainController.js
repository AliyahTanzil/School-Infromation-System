import service from '../../../application/services/studentDomainService.js';

const tenantId = (req) => req.auth?.tenantId || req.user?.tenantId;
const body = (req) => req.body || {};

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list({
        tenantId: tenantId(req),
        search: req.query.search,
        page: req.query.page,
        pageSize: req.query.pageSize,
      }),
    });
  } catch (error) {
    next(error);
  }
}
export async function get(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.get({ tenantId: tenantId(req), id: req.params.id }),
    });
  } catch (error) {
    next(error);
  }
}
export async function create(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.create({ tenantId: tenantId(req), input: body(req) }),
    });
  } catch (error) {
    next(error);
  }
}
export async function update(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.update({ tenantId: tenantId(req), id: req.params.id, input: body(req) }),
    });
  } catch (error) {
    next(error);
  }
}
export async function addGuardian(req, res, next) {
  try {
    res.status(201).json({
      success: true,
      data: await service.addGuardian({
        tenantId: tenantId(req),
        studentId: req.params.id,
        input: body(req),
      }),
    });
  } catch (error) {
    next(error);
  }
}

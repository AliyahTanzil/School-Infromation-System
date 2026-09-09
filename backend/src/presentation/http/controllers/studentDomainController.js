import service from '../../../application/services/studentDomainService.js';

const tenantId = (req) => req.schoolContext.tenantId;

export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.list({
        tenantId: tenantId(req),
        ...(req.validatedQuery ?? req.query),
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
      data: await service.create({ tenantId: tenantId(req), input: req.body }),
    });
  } catch (error) {
    next(error);
  }
}
export async function update(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.update({ tenantId: tenantId(req), id: req.params.id, input: req.body }),
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
        input: req.body,
      }),
    });
  } catch (error) {
    next(error);
  }
}

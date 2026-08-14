import * as transportService from '../../../application/services/transportService.js';

export async function overview(req, res, next) {
  try {
    res.json({ success: true, data: await transportService.getTransportOverview(req.auth) });
  } catch (error) {
    next(error);
  }
}
export async function vehicles(req, res, next) {
  try {
    res.json({
      success: true,
      data: await transportService.listVehicles({ ...req.auth, search: req.query.search }),
    });
  } catch (error) {
    next(error);
  }
}
export async function routes(req, res, next) {
  try {
    res.json({ success: true, data: await transportService.listRoutes(req.auth) });
  } catch (error) {
    next(error);
  }
}

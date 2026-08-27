import {
  getOverview,
  listAssets,
  listInventory,
} from '../../../application/services/assetInventoryService.js';

const tenantId = (req) => req.user?.tenantId || req.user?.tenant?.id;
const schoolId = (req) => req.user?.schoolId || req.user?.school?.id;

export async function overview(req, res, next) {
  try {
    res.json(await getOverview({ tenantId: tenantId(req), schoolId: schoolId(req) }));
  } catch (error) {
    next(error);
  }
}
export async function assets(req, res, next) {
  try {
    res.json(
      await listAssets({
        tenantId: tenantId(req),
        schoolId: schoolId(req),
        query: req.query.q || '',
      })
    );
  } catch (error) {
    next(error);
  }
}
export async function inventory(req, res, next) {
  try {
    res.json(
      await listInventory({
        tenantId: tenantId(req),
        schoolId: schoolId(req),
        query: req.query.q || '',
      })
    );
  } catch (error) {
    next(error);
  }
}

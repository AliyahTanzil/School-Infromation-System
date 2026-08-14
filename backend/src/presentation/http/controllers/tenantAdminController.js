import { getTenantOverview } from '../../../application/services/tenantAdminService.js';

export async function getOverview(req, res, next) {
  try {
    const data = await getTenantOverview({
      tenantId: req.user?.tenantId,
      demoMode: req.query.demo === 'true',
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

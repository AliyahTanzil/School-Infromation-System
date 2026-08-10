import { getOverview, listKpis } from '../../../application/services/analyticsService.js';

export async function overview(req, res) {
  const data = await getOverview({ tenantId: req.user?.tenantId, schoolId: req.user?.schoolId });
  return res.json({ success: true, data });
}

export async function kpis(req, res) {
  const data = await listKpis({ tenantId: req.user?.tenantId, schoolId: req.user?.schoolId });
  return res.json({ success: true, data });
}

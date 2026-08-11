import {
  analyticsDemo,
  evaluateKpi,
  getOverview,
  listKpis,
  requestExport,
} from '../../../application/services/analyticsService.js';

export async function overview(req, res) {
  const tenantId = req.user?.tenantId;
  const data = tenantId
    ? await getOverview({ tenantId, schoolId: req.user?.schoolId })
    : analyticsDemo;
  return res.json({ success: true, data });
}

export async function kpis(req, res) {
  const data = await listKpis({ tenantId: req.user?.tenantId, schoolId: req.user?.schoolId });
  return res.json({ success: true, data });
}

export async function kpi(req, res) {
  return res.json({
    success: true,
    data: evaluateKpi({ tenantId: req.user?.tenantId, metricKey: req.params.metricKey }),
  });
}

export async function exportReport(req, res) {
  return res
    .status(202)
    .json({
      success: true,
      data: requestExport({ tenantId: req.user?.tenantId, format: req.body?.format }),
    });
}

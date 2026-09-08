import {
  evaluateKpi,
  getLearningAnalytics,
  getOverview,
  listKpis,
  requestExport,
} from '../../../application/services/analyticsService.js';

const scope = (req) => req.schoolContext;

export async function overview(req, res) {
  const data = await getOverview(scope(req));
  return res.json({ success: true, data });
}

export async function kpis(req, res) {
  const data = await listKpis(scope(req));
  return res.json({ success: true, data });
}

export async function kpi(req, res) {
  return res.json({
    success: true,
    data: evaluateKpi({ ...scope(req), metricKey: req.params.metricKey }),
  });
}

export async function learningAnalytics(req, res) {
  const data = await getLearningAnalytics(scope(req));
  return res.json({ success: true, data });
}

export async function exportReport(req, res) {
  return res.status(202).json({
    success: true,
    data: requestExport({ ...scope(req), format: req.body?.format }),
  });
}

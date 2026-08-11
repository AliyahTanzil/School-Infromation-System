import {
  approveReport,
  getReportOverview,
  requestGeneration,
  requestReportExport,
  validateReport,
} from '../../../application/services/aiReportService.js';

export async function overview(req, res) {
  return res.json({ success: true, data: getReportOverview({ tenantId: req.user?.tenantId }) });
}

export async function validate(req, res) {
  return res.json({
    success: true,
    data: validateReport({ tenantId: req.user?.tenantId, report: req.body?.report }),
  });
}

export async function generate(req, res) {
  return res.status(202).json({
    success: true,
    data: requestGeneration({
      tenantId: req.user?.tenantId,
      templateKey: req.body?.templateKey,
      period: req.body?.period,
    }),
  });
}

export async function approve(req, res) {
  return res.json({
    success: true,
    data: approveReport({
      tenantId: req.user?.tenantId,
      reportId: req.params.reportId,
      reviewerId: req.user?.id,
    }),
  });
}

export async function exportReport(req, res) {
  return res.status(202).json({
    success: true,
    data: requestReportExport({
      tenantId: req.user?.tenantId,
      reportId: req.params.reportId,
      format: req.body?.format,
    }),
  });
}

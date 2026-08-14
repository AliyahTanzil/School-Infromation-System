import {
  aiAcademicDemo,
  assessAcademicRequest,
  getUsage,
} from '../../../application/services/aiAcademicService.js';

export function overview(req, res) {
  return res.json({ success: true, data: aiAcademicDemo });
}

export function ask(req, res) {
  const data = assessAcademicRequest({
    tenantId: req.user?.tenantId || 'demo-tenant',
    userId: req.user?.id || 'demo-user',
    mode: req.body?.mode,
    input: req.body?.input,
  });
  return res
    .status(data.status === 'REFUSED' ? 422 : 200)
    .json({ success: data.status !== 'REFUSED', data });
}

export function usage(req, res) {
  return res.json({
    success: true,
    data: getUsage({
      tenantId: req.user?.tenantId || 'demo-tenant',
      userId: req.user?.id || 'demo-user',
    }),
  });
}

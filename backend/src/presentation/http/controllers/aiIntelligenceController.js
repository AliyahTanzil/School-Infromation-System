import * as service from '../../../application/services/aiIntelligenceService.js';

export async function overview(req, res, next) {
  try {
    res.json(
      await service.getOverview({ tenantId: req.user?.tenantId, schoolId: req.user?.schoolId })
    );
  } catch (error) {
    next(error);
  }
}

export async function ask(req, res, next) {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question || question.length > 1000)
      return res.status(400).json({ error: 'A question up to 1000 characters is required.' });
    res.json(
      await service.ask({ tenantId: req.user?.tenantId, schoolId: req.user?.schoolId, question })
    );
  } catch (error) {
    next(error);
  }
}

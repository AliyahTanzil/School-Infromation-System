import { getOverview, runAction } from '../../../application/services/platformAdminService.js';

export async function overview(req, res) {
  if (!req.user?.isPlatformAdmin && req.user?.role !== 'PLATFORM_ADMIN')
    return res.status(403).json({ error: 'Platform administrator access required' });
  return res.json(getOverview());
}

export async function action(req, res) {
  if (!req.user?.isPlatformAdmin && req.user?.role !== 'PLATFORM_ADMIN')
    return res.status(403).json({ error: 'Platform administrator access required' });
  try {
    return res.json(await runAction(req.body, req.user.id));
  } catch {
    return res.status(400).json({ error: 'Invalid platform action' });
  }
}

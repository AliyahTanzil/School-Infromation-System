import {
  getSmartIdentityOverview,
  listSmartIdentityVerifications,
  recordVerification,
} from '../../../application/services/smartIdentityService.js';

const scope = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

export async function overview(req, res) {
  res.json({ data: await getSmartIdentityOverview(scope(req)) });
}

export async function verifications(req, res) {
  res.json({ data: await listSmartIdentityVerifications(scope(req)) });
}

export async function verify(req, res) {
  const { provider, value, deviceHash } = req.body ?? {};
  if (!value) return res.status(400).json({ error: 'Verification value is required' });
  res
    .status(201)
    .json({ data: await recordVerification({ ...scope(req), provider, value, deviceHash }) });
}

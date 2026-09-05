import { globalSearch } from '../../../application/services/searchService.js';

function scope(req) {
  return req.schoolContext;
}

function userRoles(req) {
  return req.user?.roles ?? [];
}

export async function search(req, res) {
  const query = req.query.q || req.query.query || req.query.search || '';
  const data = await globalSearch(scope(req), req.user.id, userRoles(req), String(query));
  return res.json({ success: true, data });
}

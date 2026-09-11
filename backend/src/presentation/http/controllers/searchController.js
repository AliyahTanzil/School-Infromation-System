import { globalSearch } from '../../../application/services/searchService.js';

function scope(req) {
  return req.schoolContext;
}

function access(req) {
  return { roles: req.user?.roles ?? [], platformRole: req.user?.platformRole };
}

export async function search(req, res) {
  const input = req.validatedQuery ?? req.query;
  const query = input.q || input.query || input.search || '';
  const data = await globalSearch(scope(req), req.user.id, access(req), query);
  return res.json({ success: true, data });
}

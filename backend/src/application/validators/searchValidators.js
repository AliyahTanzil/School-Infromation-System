import { z } from 'zod';
import { MAX_SEARCH_QUERY_LENGTH } from '../../domain/searchQuery.js';

const term = z.string().max(MAX_SEARCH_QUERY_LENGTH).trim().optional();

export const searchQuerySchema = z.object({
  query: z.object({ q: term, query: term, search: term }).strict(),
});

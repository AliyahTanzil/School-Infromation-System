import { z } from 'zod';
import { IMPORT_MODES, SUPPORTED_ENTITIES } from '../services/importService.js';

const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

/**
 * Accepts either a multipart file upload (`entity`, `mode`, `dryRun` form fields) or a
 * JSON body carrying the rows directly (`{ entity, mode, rows: [...] }`).
 */
export const importRequestSchema = z.object({
  body: z
    .object({
      entity: z.enum(SUPPORTED_ENTITIES),
      mode: z.enum(IMPORT_MODES).optional(),
      dryRun: booleanish.optional(),
      rows: z.array(z.record(z.any())).max(5000).optional(),
    })
    .strict(),
});

export default { importRequestSchema };

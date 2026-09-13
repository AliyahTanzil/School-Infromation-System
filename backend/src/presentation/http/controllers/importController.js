import {
  applyImport,
  describeEntities,
  normalizeRows,
} from '../../../application/services/importService.js';
import { parseTable } from '../../../shared/utils/tableParser.js';
import ValidationError from '../../../shared/errors/ValidationError.js';

export function listEntities(_req, res) {
  res.json({ success: true, data: describeEntities() });
}

export async function run(req, res, next) {
  try {
    const { entity } = req.body;
    const mode = req.body.mode ?? 'create';
    const dryRun = req.body.dryRun ?? false;

    let rows;
    if (req.file) {
      const parsed = await parseTable(req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      rows = parsed.records;
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      throw new ValidationError('Provide a file upload or a JSON "rows" array');
    }

    const { records, errors } = normalizeRows(entity, rows, mode);
    const result = await applyImport({
      entity,
      mode,
      records,
      schoolContext: req.schoolContext,
      actorId: req.user?.id,
      ipAddress: req.ip,
      dryRun,
    });

    const allErrors = [...errors, ...result.errors].sort((a, b) => a.row - b.row);
    result.summary.total = rows.length;
    result.summary.failed = allErrors.length;
    result.errors = allErrors;

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export default { listEntities, run };

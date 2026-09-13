import ValidationError from '../errors/ValidationError.js';

/**
 * Parse an uploaded data file into a tabular shape for the import pipeline.
 *
 * Supported inputs: `.csv`, `.tsv`, `.json` (array of objects), and `.xlsx`/`.xls`
 * spreadsheets (first worksheet). Parsing is format-sniffed from the filename and
 * content type; unknown formats are rejected.
 */

const MAX_COLUMNS = 100;
const MAX_ROWS = 5000;

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function detectFormat(filename = '', contentType = '') {
  const name = String(filename).toLowerCase();
  const type = String(contentType).toLowerCase();

  if (name.endsWith('.json') || type.includes('json')) return 'json';
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    type.includes('spreadsheet') ||
    type.includes('ms-excel')
  ) {
    return 'xlsx';
  }
  if (name.endsWith('.tsv') || type.includes('tab-separated')) return 'tsv';
  if (name.endsWith('.csv') || type.includes('csv')) return 'csv';
  return null;
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const source = stripBom(text);

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const isEmptyCell = (value) => value === null || value === undefined || value === '';

function rowsToRecords(matrix) {
  const cleaned = matrix.filter(
    (row) => Array.isArray(row) && row.some((cell) => !isEmptyCell(cell))
  );

  if (cleaned.length === 0) {
    throw new ValidationError('The uploaded file does not contain any rows');
  }

  const headerRow = cleaned[0].map((cell) => (isEmptyCell(cell) ? '' : String(cell).trim()));
  const headers = headerRow.filter((header) => header !== '');

  if (headers.length === 0) {
    throw new ValidationError('The uploaded file does not contain a header row');
  }
  if (headers.length > MAX_COLUMNS) {
    throw new ValidationError(`The file has too many columns (maximum ${MAX_COLUMNS})`);
  }

  const columns = headerRow.map((header, index) => header || `column_${index + 1}`);
  const records = [];

  for (const row of cleaned.slice(1)) {
    if (!row.some((cell) => !isEmptyCell(cell))) continue;
    const record = {};
    columns.forEach((column, index) => {
      record[column] = row[index] ?? '';
    });
    records.push(record);
  }

  if (records.length > MAX_ROWS) {
    throw new ValidationError(`The file has too many rows (maximum ${MAX_ROWS})`);
  }

  return { columns, records };
}

function cellToString(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function parseJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(stripBom(text));
  } catch {
    throw new ValidationError('The uploaded JSON file is not valid JSON');
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.rows)
      ? parsed.rows
      : Array.isArray(parsed?.data)
        ? parsed.data
        : null;

  if (!list) {
    throw new ValidationError(
      'JSON import must be an array of objects or an object with a rows array'
    );
  }

  const columns = [];
  const seen = new Set();
  const records = list.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ValidationError('JSON import rows must be objects');
    }
    const record = {};
    for (const [key, value] of Object.entries(entry)) {
      const column = String(key).trim();
      record[column] = cellToString(value);
      if (!seen.has(column)) {
        seen.add(column);
        columns.push(column);
      }
    }
    return record;
  });

  if (records.length === 0) {
    throw new ValidationError('The uploaded file does not contain any rows');
  }
  if (records.length > MAX_ROWS) {
    throw new ValidationError(`The file has too many rows (maximum ${MAX_ROWS})`);
  }

  return { columns, records };
}

async function parseSpreadsheet(buffer) {
  const namespace = await import('xlsx');
  const XLSX = namespace.default ?? namespace;
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames?.[0];

  if (!sheetName) {
    throw new ValidationError('The spreadsheet does not contain any worksheets');
  }

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    blankrows: false,
    defval: '',
  });

  const stringMatrix = matrix.map((row) => row.map(cellToString));
  return rowsToRecords(stringMatrix);
}

/**
 * @param {Buffer} buffer
 * @param {{ filename?: string, contentType?: string }} options
 * @returns {Promise<{ format: string, columns: string[], records: object[] }>}
 */
export async function parseTable(buffer, { filename = '', contentType = '' } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ValidationError('Provide a non-empty CSV, JSON, or spreadsheet file');
  }

  const format = detectFormat(filename, contentType);
  if (!format) {
    throw new ValidationError(
      'Unsupported file type. Upload a .csv, .tsv, .json, .xlsx, or .xls file'
    );
  }

  if (format === 'json') {
    return { format, ...parseJson(buffer.toString('utf8')) };
  }
  if (format === 'xlsx') {
    return { format, ...(await parseSpreadsheet(buffer)) };
  }

  const delimiter = format === 'tsv' ? '\t' : ',';
  return { format, ...rowsToRecords(parseDelimited(buffer.toString('utf8'), delimiter)) };
}

export default { parseTable, detectFormat };

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { describe, it } from 'node:test';
import { detectFormat, parseTable } from '../../src/shared/utils/tableParser.js';
import { normalizeRows } from '../../src/application/services/importService.js';
import { importRequestSchema } from '../../src/application/validators/importValidators.js';

const buffer = (text) => Buffer.from(text, 'utf8');

describe('import dry-run validation', () => {
  it('preserves explicit preview and write choices for JSON and multipart requests', () => {
    for (const [input, expected] of [
      [true, true],
      [false, false],
      ['true', true],
      ['false', false],
      ['1', true],
      ['0', false],
    ]) {
      const parsed = importRequestSchema.parse({ body: { entity: 'subjects', dryRun: input } });
      assert.equal(parsed.body.dryRun, expected);
    }
  });

  it('rejects malformed preview flags instead of permitting writes', () => {
    for (const dryRun of ['ture', 'TRUE', 'yes', '', ' true ', 1, 0, null, {}, []]) {
      const result = importRequestSchema.safeParse({ body: { entity: 'subjects', dryRun } });
      assert.equal(result.success, false, `Unexpectedly accepted ${JSON.stringify(dryRun)}`);
    }
  });
});

describe('tableParser', () => {
  it('detects formats from filename and content type', () => {
    assert.equal(detectFormat('data.csv'), 'csv');
    assert.equal(detectFormat('data.tsv'), 'tsv');
    assert.equal(detectFormat('data.json'), 'json');
    assert.equal(detectFormat('book.xlsx'), 'xlsx');
    assert.equal(detectFormat('', 'text/csv'), 'csv');
    assert.equal(detectFormat('data.bin'), null);
  });

  it('parses CSV including quoted commas and newlines', async () => {
    const csv = 'admissionNumber,firstName,lastName\nS-1,"Ada, Jr.",Obi\nS-2,Bola,"Line\nBreak"\n';
    const result = await parseTable(buffer(csv), { filename: 'students.csv' });

    assert.equal(result.format, 'csv');
    assert.deepEqual(result.columns, ['admissionNumber', 'firstName', 'lastName']);
    assert.equal(result.records.length, 2);
    assert.equal(result.records[0].firstName, 'Ada, Jr.');
    assert.equal(result.records[1].lastName, 'Line\nBreak');
  });

  it('parses TSV', async () => {
    const result = await parseTable(buffer('code\tname\nMTH\tMathematics\n'), {
      filename: 'subjects.tsv',
    });

    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].name, 'Mathematics');
  });

  it('parses a JSON array of objects', async () => {
    const json = JSON.stringify([{ code: 'MTH', name: 'Mathematics' }]);
    const result = await parseTable(buffer(json), { filename: 'subjects.json' });

    assert.equal(result.format, 'json');
    assert.deepEqual(result.columns, ['code', 'name']);
    assert.equal(result.records[0].code, 'MTH');
  });

  it('parses a JSON object with a rows array', async () => {
    const json = JSON.stringify({ rows: [{ code: 'ENG', name: 'English' }] });
    const result = await parseTable(buffer(json), { filename: 'subjects.json' });

    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].name, 'English');
  });

  it('parses an .xlsx spreadsheet', async () => {
    const namespace = await import('xlsx');
    const XLSX = namespace.default ?? namespace;
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['code', 'name'],
      ['MTH', 'Mathematics'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Subjects');
    const file = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const result = await parseTable(file, { filename: 'subjects.xlsx' });
    assert.equal(result.format, 'xlsx');
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].name, 'Mathematics');
  });

  it('rejects unsupported and empty files', async () => {
    await assert.rejects(
      () => parseTable(buffer('x'), { filename: 'data.bin' }),
      /Unsupported file type/
    );
    await assert.rejects(() => parseTable(buffer(''), { filename: 'data.csv' }), /non-empty/);
  });
});

describe('importService.normalizeRows', () => {
  it('maps separator-insensitive headers and coerces values', () => {
    const { records, errors } = normalizeRows(
      'students',
      [
        {
          'Admission Number': 'S-1',
          'First Name': 'Ada',
          'Last Name': 'Obi',
          Gender: 'female',
          'E-mail': 'ada@example.com',
        },
      ],
      'create'
    );

    assert.equal(errors.length, 0);
    assert.equal(records.length, 1);
    assert.equal(records[0].values.gender, 'FEMALE');
    assert.equal(records[0].values.email, 'ada@example.com');
    assert.equal(records[0].values.admissionNumber, 'S-1');
  });

  it('rejects unknown or scope columns', () => {
    assert.throws(
      () =>
        normalizeRows(
          'students',
          [{ admissionNumber: 'S-1', firstName: 'Ada', lastName: 'Obi', tenantId: 'x' }],
          'create'
        ),
      /Unknown columns/
    );
  });

  it('reports missing required columns per row', () => {
    const { errors } = normalizeRows('subjects', [{ code: 'MTH' }], 'create');

    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /Missing required columns: name/);
  });

  it('reports invalid enum and email values', () => {
    const { errors } = normalizeRows(
      'students',
      [
        {
          admissionNumber: 'S-1',
          firstName: 'Ada',
          lastName: 'Obi',
          gender: 'PLANET',
          email: 'nope',
        },
      ],
      'create'
    );

    assert.equal(errors.length, 2);
  });

  it('requires the key column outside create mode', () => {
    const { errors } = normalizeRows('subjects', [{ name: 'Mathematics' }], 'update');

    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /Missing key column "code"/);
  });

  it('requires a non-key column in update mode', () => {
    const { records, errors } = normalizeRows('subjects', [{ code: 'MTH' }], 'update');

    assert.equal(records.length, 0);
    assert.match(errors[0].message, /at least one column to update/i);
  });

  it('accepts a key-only row in delete mode', () => {
    const { records, errors } = normalizeRows('subjects', [{ code: 'MTH' }], 'delete');

    assert.equal(errors.length, 0);
    assert.equal(records[0].values.code, 'MTH');
  });
});

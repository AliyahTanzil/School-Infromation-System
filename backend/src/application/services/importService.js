import { randomUUID } from 'node:crypto';
import prisma from '../../infrastructure/orm/prismaClient.js';
import auditLogRepository from '../../infrastructure/repositories/auditLogRepository.js';
import ValidationError from '../../shared/errors/ValidationError.js';

/**
 * Generic, school-scoped data importer.
 *
 * A file (parsed by `shared/utils/tableParser.js`) is mapped onto a whitelisted
 * entity, each row is validated against that entity's field contract, and the row
 * is applied to the database in the requested mode (create/upsert/update/delete).
 *
 * Scope (tenantId/schoolId) is always taken from the authenticated request context
 * and never from the uploaded data. Columns that are not part of the entity
 * contract — including scope and identity columns — are rejected.
 */

export const IMPORT_MODES = ['create', 'upsert', 'update', 'delete'];

const GENDER = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'];
const TEACHER_STATUS = [
  'APPLICANT',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
  'RETIRED',
];
const SUBJECT_STATUS = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeKey = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Entities marked with `nested: true` are stored on the entity's one-to-one `profile` relation.
export const IMPORT_ENTITIES = {
  students: {
    label: 'Students',
    model: 'student',
    key: 'admissionNumber',
    scope: ['tenantId'],
    fields: {
      admissionNumber: { type: 'string', required: true, max: 60 },
      firstName: { type: 'string', required: true, max: 100 },
      lastName: { type: 'string', required: true, max: 100 },
      dateOfBirth: { type: 'date' },
      gender: { type: 'enum', values: GENDER },
      email: { type: 'email', max: 320 },
      phone: { type: 'string', max: 40 },
    },
  },
  teachers: {
    label: 'Teachers',
    model: 'teacher',
    key: 'employeeNumber',
    scope: ['tenantId', 'schoolId'],
    fields: {
      employeeNumber: { type: 'string', required: true, max: 60 },
      status: { type: 'enum', values: TEACHER_STATUS },
      firstName: { type: 'string', max: 100, nested: true },
      lastName: { type: 'string', max: 100, nested: true },
      email: { type: 'email', max: 320, nested: true },
      phone: { type: 'string', max: 40, nested: true },
    },
  },
  subjects: {
    label: 'Subjects',
    model: 'subject',
    key: 'code',
    scope: ['tenantId', 'schoolId'],
    fields: {
      code: { type: 'string', required: true, max: 40 },
      name: { type: 'string', required: true, max: 150 },
      description: { type: 'string', max: 500 },
      status: { type: 'enum', values: SUBJECT_STATUS },
    },
  },
};

export const SUPPORTED_ENTITIES = Object.keys(IMPORT_ENTITIES);

export function describeEntities() {
  return SUPPORTED_ENTITIES.map((name) => {
    const entity = IMPORT_ENTITIES[name];
    return {
      entity: name,
      label: entity.label,
      key: entity.key,
      scope: entity.scope,
      columns: Object.entries(entity.fields).map(([field, def]) => ({
        field,
        type: def.type,
        required: Boolean(def.required),
        ...(def.values ? { values: def.values } : {}),
      })),
    };
  });
}

function resolveEntity(name) {
  const entity =
    IMPORT_ENTITIES[
      String(name ?? '')
        .trim()
        .toLowerCase()
    ];
  if (!entity) {
    throw new ValidationError(
      `Unsupported import entity. Supported entities: ${SUPPORTED_ENTITIES.join(', ')}`
    );
  }
  return entity;
}

const isEmpty = (value) => value === null || value === undefined || String(value).trim() === '';

function coerceField(field, def, rawValue) {
  if (def.type === 'date') {
    const date = rawValue instanceof Date ? rawValue : new Date(String(rawValue).trim());
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError(`"${field}" is not a valid date`);
    }
    return date;
  }

  if (def.type === 'enum') {
    const value = String(rawValue).trim().toUpperCase();
    if (!def.values.includes(value)) {
      throw new ValidationError(`"${field}" must be one of: ${def.values.join(', ')}`);
    }
    return value;
  }

  const text = String(rawValue).trim();
  if (def.type === 'email' && !EMAIL_PATTERN.test(text)) {
    throw new ValidationError(`"${field}" is not a valid email address`);
  }
  if (def.max && text.length > def.max) {
    throw new ValidationError(`"${field}" exceeds the maximum length of ${def.max}`);
  }
  return text;
}

/**
 * Pure mapping/validation of parsed rows onto an entity contract. No database access,
 * so this is fully unit-testable.
 *
 * @returns {{ records: Array<{ row: number, values: object, provided: string[] }>, errors: Array<{ row: number, message: string }> }}
 */
export function normalizeRows(entityName, rows, mode = 'create') {
  const entity = resolveEntity(entityName);
  if (!IMPORT_MODES.includes(mode)) {
    throw new ValidationError(`mode must be one of: ${IMPORT_MODES.join(', ')}`);
  }

  const fieldByKey = new Map();
  for (const field of Object.keys(entity.fields)) {
    const key = normalizeKey(field);
    if (fieldByKey.has(key)) {
      throw new ValidationError(`Entity contract has ambiguous column "${field}"`);
    }
    fieldByKey.set(key, field);
  }

  const records = Array.isArray(rows) ? rows : [];
  const unknownColumns = new Set();
  for (const record of records) {
    for (const [column, value] of Object.entries(record)) {
      if (isEmpty(value)) continue;
      if (!fieldByKey.has(normalizeKey(column))) unknownColumns.add(column);
    }
  }
  if (unknownColumns.size > 0) {
    throw new ValidationError(
      `Unknown columns for "${entityName}": ${[...unknownColumns].join(', ')}. ` +
        `Allowed columns: ${Object.keys(entity.fields).join(', ')}`
    );
  }

  const normalized = [];
  const errors = [];

  records.forEach((record, index) => {
    const row = index + 1;
    const values = {};
    const provided = [];

    for (const [column, rawValue] of Object.entries(record)) {
      const field = fieldByKey.get(normalizeKey(column));
      if (!field || isEmpty(rawValue)) continue;
      try {
        values[field] = coerceField(field, entity.fields[field], rawValue);
        provided.push(field);
      } catch (error) {
        errors.push({ row, message: error.message });
      }
    }

    if (errors.some((entry) => entry.row === row)) return;

    const missing = Object.entries(entity.fields)
      .filter(
        ([field, def]) => def.required && values[field] === undefined && !provided.includes(field)
      )
      .map(([field]) => field);

    if (mode === 'create' && missing.length > 0) {
      errors.push({ row, message: `Missing required columns: ${missing.join(', ')}` });
      return;
    }

    if (mode !== 'create' && values[entity.key] === undefined) {
      errors.push({ row, message: `Missing key column "${entity.key}"` });
      return;
    }

    if (mode === 'update' && provided.filter((field) => field !== entity.key).length === 0) {
      errors.push({ row, message: 'Provide at least one column to update besides the key' });
      return;
    }

    normalized.push({ row, values, provided });
  });

  return { records: normalized, errors };
}

function splitValues(entity, values) {
  const scalars = {};
  const nested = {};
  for (const [field, value] of Object.entries(values)) {
    if (entity.fields[field]?.nested) nested[field] = value;
    else scalars[field] = value;
  }
  return { scalars, nested };
}

function buildCreateData(entity, values, scope) {
  const { scalars, nested } = splitValues(entity, values);
  const data = { id: randomUUID(), ...scope, ...scalars };
  if (Object.keys(nested).length > 0) data.profile = { create: nested };
  return data;
}

function buildUpdateData(entity, values) {
  const { scalars, nested } = splitValues(entity, values);
  const data = { ...scalars };
  if (Object.keys(nested).length > 0) {
    data.profile = { upsert: { create: nested, update: nested } };
  }
  return data;
}

function isUniqueConflict(error) {
  return error?.code === 'P2002';
}

async function findExisting(entity, scope, keyValue) {
  if (keyValue === undefined) return null;
  return prisma[entity.model].findFirst({ where: { ...scope, [entity.key]: keyValue } });
}

/**
 * Apply previously normalized rows to the database within the request's school scope.
 *
 * @param {object} params
 * @param {string} params.entity
 * @param {string} params.mode
 * @param {Array<{ row: number, values: object }>} params.records
 * @param {{ tenantId: string, schoolId: string }} params.schoolContext
 * @param {string} [params.actorId]
 * @param {string} [params.ipAddress]
 * @param {boolean} [params.dryRun]
 */
export async function applyImport({
  entity: entityName,
  mode = 'create',
  records,
  schoolContext,
  actorId,
  ipAddress,
  dryRun = false,
}) {
  const entity = resolveEntity(entityName);

  if (!schoolContext?.tenantId) {
    throw new ValidationError('Tenant scope is required for import');
  }
  if (entity.scope.includes('schoolId') && !schoolContext.schoolId) {
    throw new ValidationError('School scope is required for import');
  }

  const scope = { tenantId: schoolContext.tenantId };
  if (entity.scope.includes('schoolId')) scope.schoolId = schoolContext.schoolId;

  const summary = {
    total: Array.isArray(records) ? records.length : 0,
    created: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
  };
  const errors = [];

  for (const record of records ?? []) {
    const { row, values } = record;
    try {
      const existing = await findExisting(entity, scope, values[entity.key]);

      if (mode === 'delete') {
        if (!existing)
          throw new ValidationError(`No record found for ${entity.key} "${values[entity.key]}"`);
        if (!dryRun) await prisma[entity.model].delete({ where: { id: existing.id } });
        summary.deleted += 1;
        continue;
      }

      if (mode === 'update') {
        if (!existing)
          throw new ValidationError(`No record found for ${entity.key} "${values[entity.key]}"`);
        if (!dryRun)
          await prisma[entity.model].update({
            where: { id: existing.id },
            data: buildUpdateData(entity, values),
          });
        summary.updated += 1;
        continue;
      }

      if (mode === 'upsert' && existing) {
        if (!dryRun)
          await prisma[entity.model].update({
            where: { id: existing.id },
            data: buildUpdateData(entity, values),
          });
        summary.updated += 1;
        continue;
      }

      if (!dryRun)
        await prisma[entity.model].create({ data: buildCreateData(entity, values, scope) });
      summary.created += 1;
    } catch (error) {
      summary.failed += 1;
      const message = isUniqueConflict(error)
        ? `A record with ${entity.key} "${values[entity.key]}" already exists`
        : error instanceof ValidationError
          ? error.message
          : 'The row could not be saved';
      errors.push({ row, message });
    }
  }

  await auditLogRepository.record({
    tenantId: schoolContext.tenantId,
    actorId: actorId ?? null,
    action: 'IMPORT',
    entityType: `import:${entityName}`,
    entityId: null,
    metadata: { entity: entityName, mode, dryRun, ...summary },
    ipAddress: ipAddress ?? null,
  });

  return { entity: entityName, mode, dryRun, summary, errors };
}

export default { normalizeRows, applyImport, describeEntities, SUPPORTED_ENTITIES, IMPORT_MODES };

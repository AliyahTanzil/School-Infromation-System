import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/hrService.js');
const controller = await import('../../src/presentation/http/controllers/hrController.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const context = { ...ownership, actorId: 'actor' };
const period = { periodStart: new Date('2026-09-01'), periodEnd: new Date('2026-09-30') };

function fixture({ empty = false, failure } = {}) {
  const committed = [];
  const attempted = [];
  const error = new Error(`Failed ${failure}`);
  db.$transaction = async (work) => {
    const pending = [];
    const write = (stage, data) => {
      attempted.push(stage);
      if (failure === stage) throw error;
      pending.push({ stage, data });
      return { id: 'run', ...data };
    };
    const result = await work({
      employee: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { ...ownership, status: { in: ['ACTIVE', 'ON_LEAVE'] } });
          return empty ? [] : [{ id: 'employee', positionId: 'position' }];
        },
      },
      hRPosition: { findMany: async () => (empty ? [] : [{ id: 'position', salaryMinor: 12500 }]) },
      payrollRun: { create: async ({ data }) => write('run', data) },
      payrollItem: { createMany: async ({ data }) => write('items', data) },
      auditLog: { create: async ({ data }) => write('audit', data) },
    });
    if (failure === 'commit') throw error;
    committed.push(...pending);
    return result;
  };
  return { committed, attempted, error };
}

test('payroll creation audits authenticated ownership and excludes caller-controlled fields', async () => {
  const { committed } = fixture();
  let response;
  await controller.createPayroll(
    {
      schoolContext: ownership,
      user: { id: 'actor' },
      body: {
        ...period,
        tenantId: 'foreign',
        schoolId: 'foreign',
        actorId: 'forged',
        id: 'forged',
        status: 'FINALIZED',
        totalMinor: 1,
        processedAt: new Date(),
      },
    },
    {
      status(code) {
        assert.equal(code, 201);
        return this;
      },
      json(value) {
        response = value;
      },
    }
  );
  assert.equal(response.data.totalMinor, 12500);
  assert.deepEqual(
    committed.map((entry) => entry.stage),
    ['run', 'items', 'audit']
  );
  assert.deepEqual(committed[0].data, {
    ...period,
    ...ownership,
    status: 'DRAFT',
    totalMinor: 12500,
  });
  assert.deepEqual(committed[2].data, {
    tenantId: 'tenant',
    actorId: 'actor',
    action: 'CREATE',
    entityType: 'PayrollRun',
    entityId: 'run',
    metadata: { schoolId: 'school', toStatus: 'DRAFT', totalMinor: 12500, itemCount: 1 },
  });
});

test('run, item, audit and commit failures leave no committed payroll or audit', async () => {
  for (const failure of ['run', 'items', 'audit', 'commit']) {
    const { committed, attempted, error } = fixture({ failure });
    await assert.rejects(service.createPayrollRun(context, period), (actual) => actual === error);
    assert.deepEqual(committed, []);
    assert.deepEqual(
      attempted,
      ['run', 'items', 'audit'].slice(0, failure === 'run' ? 1 : failure === 'items' ? 2 : 3)
    );
  }
});

test('empty payroll drafts still receive a zero-total creation audit', async () => {
  const { committed } = fixture({ empty: true });
  await service.createPayrollRun(context, period);
  assert.deepEqual(
    committed.map((entry) => entry.stage),
    ['run', 'audit']
  );
  assert.deepEqual(committed[1].data.metadata, {
    schoolId: 'school',
    toStatus: 'DRAFT',
    totalMinor: 0,
    itemCount: 0,
  });
});

test('missing authenticated payroll creator fails before database access', async () => {
  db.$transaction = () => assert.fail('Unexpected database access');
  await assert.rejects(
    service.createPayrollRun(ownership, { ...period, actorId: 'forged' }),
    /Payroll actor identity is required/
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { finalizePayrollRun } = await import('../../src/application/services/hrService.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const context = { ...ownership, actorId: 'actor' };
const item = {
  employeeId: 'employee',
  grossMinor: 100,
  deductionsMinor: 20,
  netMinor: 80,
  status: 'PENDING',
};

function fixture({
  items = [item],
  totalMinor = 80,
  missing = false,
  employees = 1,
  claimed = 1,
  auditError,
} = {}) {
  const committed = [];
  db.$transaction = async (work, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const pending = [];
    const result = await work({
      payrollRun: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'run', ...ownership, status: 'DRAFT' });
          return missing ? null : { id: 'run', ...ownership, totalMinor, status: 'DRAFT' };
        },
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, { id: 'run', ...ownership, status: 'DRAFT', totalMinor });
          pending.push({ run: data });
          return { count: claimed };
        },
      },
      payrollItem: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { payrollRunId: 'run', ...ownership });
          return items;
        },
      },
      employee: {
        count: async ({ where }) => {
          assert.deepEqual(where, {
            ...ownership,
            id: { in: [...new Set(items.map((entry) => entry.employeeId))] },
          });
          return employees;
        },
      },
      auditLog: {
        create: async ({ data }) => {
          if (auditError) throw auditError;
          pending.push({ audit: data });
          return data;
        },
      },
    });
    committed.push(...pending);
    return result;
  };
  return committed;
}

test('finalization reconciles net pay and atomically records the authenticated audit', async () => {
  const writes = fixture();
  const result = await finalizePayrollRun(context, 'run');
  assert.equal(result.status, 'FINALIZED');
  assert.ok(result.processedAt instanceof Date);
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[1].audit, {
    tenantId: 'tenant',
    actorId: 'actor',
    action: 'UPDATE',
    entityType: 'PayrollRun',
    entityId: 'run',
    metadata: {
      schoolId: 'school',
      fromStatus: 'DRAFT',
      toStatus: 'FINALIZED',
      totalMinor: 80,
      itemCount: 1,
    },
  });
});

test('invalid draft amounts, deductions, status, duplicates and totals prevent finalization', async () => {
  for (const options of [
    { totalMinor: 81 },
    { totalMinor: -1 },
    ...[-1, 0.5, null, '100', 2147483648].map((grossMinor) => ({
      items: [{ ...item, grossMinor }],
    })),
    { items: [{ ...item, deductionsMinor: -1 }] },
    { items: [{ ...item, netMinor: 99 }] },
    { items: [{ ...item, status: 'PAID' }] },
    { items: [item, item], totalMinor: 160 },
    {
      items: [0, 1].map((n) => ({
        ...item,
        employeeId: `employee-${n}`,
        grossMinor: 2147483647,
        deductionsMinor: 0,
        netMinor: 2147483647,
      })),
    },
    { employees: 0 },
  ]) {
    const writes = fixture(options);
    await assert.rejects(finalizePayrollRun(context, 'run'), /Payroll draft/);
    assert.deepEqual(writes, []);
  }
});

test('missing, foreign or previously finalized runs and lost claims cannot finalize', async () => {
  for (const options of [{ missing: true }, { claimed: 0 }]) {
    const writes = fixture(options);
    await assert.rejects(finalizePayrollRun(context, 'run'), /not found|draft changed/);
    assert.deepEqual(writes, []);
  }
});

test('audit failure rolls back finalization and serialization failure becomes a conflict', async () => {
  const error = new Error('Audit unavailable');
  const writes = fixture({ auditError: error });
  await assert.rejects(finalizePayrollRun(context, 'run'), (actual) => actual === error);
  assert.deepEqual(writes, []);
  db.$transaction = async () => {
    throw Object.assign(new Error('serialization'), { code: 'P2034' });
  };
  await assert.rejects(finalizePayrollRun(context, 'run'), /reload before finalizing/);
});

test('finalization requires an actor before accessing persistence', async () => {
  db.$transaction = () => assert.fail('Unexpected persistence');
  await assert.rejects(finalizePayrollRun(ownership, 'run'), /actor identity is required/);
});

test('explicit zero-pay and empty zero-total drafts remain supported', async () => {
  for (const items of [[], [{ ...item, grossMinor: 0, deductionsMinor: 0, netMinor: 0 }]]) {
    fixture({ items, totalMinor: 0, employees: items.length });
    assert.equal((await finalizePayrollRun(context, 'run')).totalMinor, 0);
  }
});

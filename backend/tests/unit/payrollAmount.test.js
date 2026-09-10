import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { createPayrollRun } = await import('../../src/application/services/hrService.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const maxMinor = 2147483647;

function fixture(amounts, { missingPosition = false, unassigned = false } = {}) {
  const writes = [];
  db.$transaction = async (work) =>
    work({
      employee: {
        findMany: async () =>
          amounts.map((_, index) => ({
            id: `employee-${index}`,
            positionId: unassigned ? null : `position-${index}`,
          })),
      },
      hRPosition: {
        findMany: async ({ where }) => {
          assert.equal(where.tenantId, 'tenant');
          assert.equal(where.schoolId, 'school');
          return missingPosition
            ? []
            : amounts.map((salaryMinor, index) => ({ id: `position-${index}`, salaryMinor }));
        },
      },
      payrollRun: {
        create: async ({ data }) => {
          writes.push({ run: data });
          return { id: 'run', ...data };
        },
      },
      payrollItem: {
        createMany: async ({ data }) => {
          writes.push({ items: data });
        },
      },
    });
  return writes;
}

test('payroll rejects invalid salary minor units before creating runs or items', async () => {
  for (const amount of [-1, 0.5, NaN, Infinity, maxMinor + 1, null, undefined, '100']) {
    const writes = fixture([amount]);
    await assert.rejects(createPayrollRun(ownership, {}), /whole minor units/);
    assert.deepEqual(writes, []);
  }
});

test('payroll rejects aggregate integer overflow before any financial writes', async () => {
  const writes = fixture([maxMinor, 1]);
  await assert.rejects(createPayrollRun(ownership, {}), /Payroll total exceeds/);
  assert.deepEqual(writes, []);
});

test('payroll preserves exact totals and item amounts at the database boundary', async () => {
  const writes = fixture([maxMinor - 100, 100, 0]);
  const result = await createPayrollRun(ownership, {});
  assert.equal(result.totalMinor, maxMinor);
  assert.equal(writes.length, 2);
  assert.deepEqual(
    writes[1].items,
    [maxMinor - 100, 100, 0].map((amount, index) => ({
      ...ownership,
      employeeId: `employee-${index}`,
      payrollRunId: 'run',
      grossMinor: amount,
      netMinor: amount,
    }))
  );
});

test('payroll requires a scoped position instead of silently substituting a zero salary', async () => {
  for (const options of [{ missingPosition: true }, { unassigned: true }]) {
    const writes = fixture([100], options);
    await assert.rejects(createPayrollRun(ownership, {}), /must have a position/);
    assert.deepEqual(writes, []);
  }
});

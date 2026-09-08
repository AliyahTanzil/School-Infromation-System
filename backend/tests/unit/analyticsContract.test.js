import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOverview,
  listKpis,
  getLearningAnalytics,
  evaluateKpi,
  requestExport,
} from '../../src/application/services/analyticsService.js';

const scope = { tenantId: 'tenant-1', schoolId: 'school-1' };
function database(t, empty = false) {
  const mocks = {
    student: t.mock.fn(async () => (empty ? 0 : 60)),
    teacher: t.mock.fn(async () => (empty ? 0 : 3)),
    attendance: t.mock.fn(async ({ where }) => (empty ? 0 : where.status ? 8 : 10)),
    payment: t.mock.fn(async () => ({
      _sum: { amount: empty ? null : '150.00' },
    })),
    invoice: t.mock.fn(async () => ({
      _sum: { total: empty ? null : '200.00' },
    })),
  };
  return {
    mocks,
    db: {
      student: { count: mocks.student },
      teacher: { count: mocks.teacher },
      attendanceRecord: { count: mocks.attendance },
      payment: { aggregate: mocks.payment },
      invoice: { aggregate: mocks.invoice },
    },
  };
}

test('overview calculates actual attendance, collections and staffing with valid scoped queries', async (t) => {
  const { mocks, db } = database(t);
  const result = await getOverview(scope, db);
  assert.deepEqual(
    result.metrics.map((m) => m.value),
    ['60', '80%', '75%', '20']
  );
  assert.deepEqual(mocks.invoice.mock.calls[0].arguments[0], {
    _sum: { total: true },
    where: scope,
  });
  assert.deepEqual(mocks.payment.mock.calls[0].arguments[0], {
    _sum: { amount: true },
    where: { ...scope, status: 'SUCCEEDED' },
  });
  assert.deepEqual(mocks.student.mock.calls[0].arguments[0].where, {
    tenantId: scope.tenantId,
    classEnrollments: { some: { ...scope, status: 'ACTIVE' } },
  });
  assert.deepEqual(mocks.attendance.mock.calls[1].arguments[0].where, scope);
  assert.deepEqual(result.series, []);
  assert.ok(result.metrics.every((m) => m.change === null));
});

test('empty database reports zero students and unavailable rates without invented values', async (t) => {
  const { db } = database(t, true);
  const result = await getOverview(scope, db);
  assert.deepEqual(
    result.metrics.map((m) => m.value),
    ['0', 'Not available', 'Not available', 'Not available']
  );
  assert.ok((await listKpis(scope, db)).every((kpi) => kpi.value === null));
});

test('database failures reject overview and KPIs instead of returning success data', async (t) => {
  const { db } = database(t);
  const failure = new Error('Database unavailable');
  db.invoice.aggregate = async () => {
    throw failure;
  };
  await assert.rejects(getOverview(scope, db), (error) => error === failure);
  await assert.rejects(listKpis(scope, db), (error) => error === failure);
});

test('missing scope is rejected and computed KPIs match the overview', async (t) => {
  const { db } = database(t);
  await assert.rejects(getOverview({}, db), /School scope required/);
  await assert.rejects(getOverview({ tenantId: scope.tenantId }, db), /School scope required/);
  await assert.rejects(listKpis({}, db), /School scope required/);
  await assert.rejects(
    getLearningAnalytics({ tenantId: scope.tenantId }, db),
    /School scope required/
  );
  assert.throws(
    () => evaluateKpi({ tenantId: scope.tenantId, metricKey: 'attendance' }),
    /School scope required/
  );
  assert.throws(() => requestExport({ tenantId: scope.tenantId }), /School scope required/);
  assert.deepEqual(
    (await listKpis(scope, db)).map((kpi) => kpi.value),
    [80, 75]
  );
});

test('learning analytics contract uses isolated school-scoped database fixtures', async (t) => {
  const subjects = t.mock.fn(async () => []);
  const classes = t.mock.fn(async () => []);
  const db = { subject: { findMany: subjects }, class: { findMany: classes } };
  const learning = await getLearningAnalytics(scope, db);
  assert.ok(Array.isArray(learning.subjects));
  assert.ok(Array.isArray(learning.learners));
  assert.deepEqual(subjects.mock.calls[0].arguments[0].where, {
    ...scope,
    status: 'ACTIVE',
  });
  assert.deepEqual(classes.mock.calls[0].arguments[0].where, {
    ...scope,
    status: 'ACTIVE',
  });
});

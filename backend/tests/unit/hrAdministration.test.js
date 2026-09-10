import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  employeeQuerySchema,
  employeeCreateSchema,
  leaveCreateSchema,
  leaveDecisionSchema,
  payrollCreateSchema,
  payrollParamsSchema,
} from '../../src/application/validators/hrValidators.js';

const fail = () => assert.fail('Unexpected persistence access');
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/hrService.js');
const controller = await import('../../src/presentation/http/controllers/hrController.js');
const ownership = { tenantId: 'tenant', schoolId: 'school' };
const id = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  db.$transaction = fail;
  for (const model of ['employee', 'leaveRequest', 'payrollRun', 'hRDepartment', 'hRPosition']) {
    db[model] = { findMany: fail, findFirst: fail, count: fail, create: fail, updateMany: fail };
  }
});

test('HR requests reject ownership overrides, invalid identifiers and reversed dates', () => {
  assert.equal(employeeQuerySchema.safeParse({ query: { schoolId: id } }).success, false);
  assert.equal(employeeQuerySchema.safeParse({ query: { status: 'ACTIVE' } }).success, true);
  const employee = { employeeNumber: 'EMP-1', firstName: 'First', lastName: 'Last' };
  assert.equal(employeeCreateSchema.safeParse({ body: employee }).success, true);
  assert.equal(
    employeeCreateSchema.safeParse({ body: { ...employee, tenantId: id } }).success,
    false
  );
  assert.equal(
    leaveDecisionSchema.safeParse({
      params: { id },
      body: { status: 'APPROVED', approvedById: id },
    }).success,
    false
  );
  assert.equal(payrollParamsSchema.safeParse({ params: { id: 'invalid' } }).success, false);
  assert.equal(payrollParamsSchema.safeParse({ params: { id, schoolId: id } }).success, false);
  assert.equal(
    payrollCreateSchema.safeParse({ body: { periodStart: '2026-09-30', periodEnd: '2026-09-01' } })
      .success,
    false
  );
  assert.equal(
    leaveCreateSchema.safeParse({
      body: { employeeId: id, leaveType: 'Annual', startsAt: '2026-09-30', endsAt: '2026-09-01' },
    }).success,
    false
  );
});

test('every HR operation refuses incomplete school ownership before persistence', async () => {
  for (const context of [{}, { tenantId: 'tenant' }, { schoolId: 'school' }]) {
    for (const operation of [
      () => service.dashboard(context),
      () => service.listEmployees(context),
      () => service.createEmployee(context, {}),
      () => service.listLeaveRequests(context),
      () => service.requestLeave(context, {}),
      () => service.approveLeave({ ...context, id, approvedById: 'actor', status: 'APPROVED' }),
      () => service.createPayrollRun(context, {}),
      () => service.finalizePayrollRun(context, id),
    ])
      await assert.rejects(operation, /School context is required/);
  }
});

test('employee references and creation share a transaction and retain authenticated ownership', async () => {
  let writes = 0;
  db.$transaction = async (work) =>
    work({
      hRDepartment: {
        count: async ({ where }) => {
          assert.deepEqual(where, { id, ...ownership, active: true });
          return 1;
        },
      },
      hRPosition: {
        count: async ({ where }) => {
          assert.deepEqual(where, { id, ...ownership, active: true });
          return 1;
        },
      },
      employee: {
        create: async ({ data }) => {
          assert.equal(data.tenantId, 'tenant');
          assert.equal(data.schoolId, 'school');
          assert.equal(data.status, 'APPLICANT');
          writes++;
          return { id };
        },
      },
    });
  await service.createEmployee(ownership, {
    departmentId: id,
    positionId: id,
    tenantId: 'foreign',
    schoolId: 'foreign',
    status: 'ACTIVE',
  });
  assert.equal(writes, 1);
});

test('foreign or inactive employee references prevent creation', async () => {
  for (const missing of ['hRDepartment', 'hRPosition']) {
    db.$transaction = async (work) =>
      work({
        hRDepartment: { count: async () => (missing === 'hRDepartment' ? 0 : 1) },
        hRPosition: { count: async () => (missing === 'hRPosition' ? 0 : 1) },
        employee: { create: fail },
      });
    await assert.rejects(
      service.createEmployee(ownership, { departmentId: id, positionId: id }),
      /outside the active school context/
    );
  }
});

test('leave creation verifies its employee in the transaction and prevents scope or status overrides', async () => {
  let found = false;
  db.$transaction = async (work) =>
    work({
      employee: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id, ...ownership });
          return found ? { id } : null;
        },
      },
      leaveRequest: {
        create: async ({ data }) => {
          assert.ok(found);
          assert.equal(data.schoolId, 'school');
          assert.equal(data.tenantId, 'tenant');
          assert.equal(data.status, 'PENDING');
          return data;
        },
      },
    });
  await assert.rejects(service.requestLeave(ownership, { employeeId: id }), /Employee not found/);
  found = true;
  await service.requestLeave(ownership, {
    employeeId: id,
    schoolId: 'foreign',
    tenantId: 'foreign',
    status: 'APPROVED',
  });
});

test('controllers preserve authenticated list scope and leave approver identity', async () => {
  db.employee.findMany = async ({ where }) => {
    assert.deepEqual(where, { ...ownership, status: 'ACTIVE' });
    return [];
  };
  const req = {
    schoolContext: ownership,
    user: { id: 'actor' },
    query: { tenantId: 'foreign', schoolId: 'foreign', status: 'ACTIVE' },
    params: { id },
    body: {
      tenantId: 'foreign',
      schoolId: 'foreign',
      id: 'foreign',
      approvedById: 'foreign',
      status: 'APPROVED',
    },
  };
  const res = { json() {} };
  await controller.employees(req, res);
  db.leaveRequest.updateMany = async ({ where, data }) => {
    assert.deepEqual(where, { id, ...ownership, status: 'PENDING' });
    assert.equal(data.approvedById, 'actor');
    return { count: 1 };
  };
  db.leaveRequest.findFirst = async ({ where }) => {
    assert.deepEqual(where, { id, ...ownership });
    return { id };
  };
  await controller.approveLeave(req, res);
  await assert.rejects(
    service.approveLeave({ ...ownership, id, status: 'APPROVED' }),
    /Approver identity/
  );
  await assert.rejects(
    service.approveLeave({ ...ownership, id, approvedById: 'actor', status: 'PENDING' }),
    /Invalid leave decision/
  );
});

test('payroll creation keeps authenticated ownership and server-controlled totals and status', async () => {
  db.$transaction = async (work) =>
    work({
      employee: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { ...ownership, status: { in: ['ACTIVE', 'ON_LEAVE'] } });
          return [];
        },
      },
      hRPosition: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { ...ownership, id: { in: [] } });
          return [];
        },
      },
      payrollRun: {
        create: async ({ data }) => {
          assert.equal(data.tenantId, 'tenant');
          assert.equal(data.schoolId, 'school');
          assert.equal(data.status, 'DRAFT');
          assert.equal(data.totalMinor, 0);
          return { id };
        },
      },
      auditLog: { create: async () => ({ id: 'audit' }) },
    });
  await service.createPayrollRun(
    { ...ownership, actorId: 'actor' },
    {
      tenantId: 'foreign',
      schoolId: 'foreign',
      status: 'FINALIZED',
      totalMinor: 999,
    }
  );
});

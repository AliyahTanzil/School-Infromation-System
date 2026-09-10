import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';

const scope = ({ tenantId, schoolId } = {}) => {
  if (!tenantId || !schoolId) throw new AuthorizationError('School context is required');
  return { tenantId, schoolId };
};

export async function dashboard({ tenantId, schoolId }) {
  scope({ tenantId, schoolId });
  const [employees, pendingLeave, payrollRuns, departments, positions] = await Promise.all([
    prisma.employee.count({
      where: { tenantId, schoolId, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
    }),
    prisma.leaveRequest.count({ where: { tenantId, schoolId, status: 'PENDING' } }),
    prisma.payrollRun.findMany({
      where: { tenantId, schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.hRDepartment.findMany({
      where: { tenantId, schoolId, active: true },
      orderBy: { name: 'asc' },
    }),
    prisma.hRPosition.findMany({
      where: { tenantId, schoolId, active: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  return { employees, pendingLeave, payrollRuns, departments, positions };
}

export async function listEmployees({ tenantId, schoolId, status }) {
  scope({ tenantId, schoolId });
  return prisma.employee.findMany({
    where: { tenantId, schoolId, ...(status ? { status } : {}) },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
  });
}

export async function createEmployee(context, data) {
  const ownership = scope(context);
  return prisma.$transaction(async (tx) => {
    const references = [
      data.departmentId
        ? tx.hRDepartment.count({ where: { id: data.departmentId, ...ownership, active: true } })
        : Promise.resolve(1),
      data.positionId
        ? tx.hRPosition.count({ where: { id: data.positionId, ...ownership, active: true } })
        : Promise.resolve(1),
    ];
    const [departmentExists, positionExists] = await Promise.all(references);
    if (!departmentExists || !positionExists)
      throw new ValidationError('Department or position is outside the active school context');
    return tx.employee.create({
      data: { ...data, ...ownership, emergencyContact: {}, status: 'APPLICANT' },
    });
  });
}

export async function listLeaveRequests(context) {
  return prisma.leaveRequest.findMany({
    where: scope(context),
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function requestLeave(context, data) {
  const ownership = scope(context);
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findFirst({
      where: { id: data.employeeId, ...ownership },
    });
    if (!employee) throw new NotFoundError('Employee not found');
    return tx.leaveRequest.create({ data: { ...data, ...ownership, status: 'PENDING' } });
  });
}

export async function approveLeave({ tenantId, schoolId, id, approvedById, status }) {
  scope({ tenantId, schoolId });
  if (!approvedById) throw new AuthorizationError('Approver identity is required');
  if (!['APPROVED', 'REJECTED'].includes(status))
    throw new ValidationError('Invalid leave decision');
  const result = await prisma.leaveRequest.updateMany({
    where: { id, tenantId, schoolId, status: 'PENDING' },
    data: { status, approvedById, approvedAt: new Date() },
  });
  if (!result.count) throw new NotFoundError('Leave request not found or already decided');
  return prisma.leaveRequest.findFirst({ where: { id, tenantId, schoolId } });
}

export async function createPayrollRun(context, data) {
  const ownership = scope(context);
  if (!context.actorId) throw new AuthorizationError('Payroll actor identity is required');
  return prisma.$transaction(async (tx) => {
    const employees = await tx.employee.findMany({
      where: { ...ownership, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
    });
    const positionIds = [...new Set(employees.map((item) => item.positionId).filter(Boolean))];
    const positions = await tx.hRPosition.findMany({
      where: { ...ownership, id: { in: positionIds } },
    });
    const salaries = new Map(positions.map((item) => [item.id, item.salaryMinor]));
    // PayrollRun and PayrollItem monetary columns are signed PostgreSQL Int values.
    const maxMinor = 2147483647;
    let totalMinor = 0;
    const items = employees.map((employee) => {
      if (!employee.positionId || !salaries.has(employee.positionId))
        throw new ValidationError(
          'Every payroll employee must have a position in the active school'
        );
      const grossMinor = salaries.get(employee.positionId);
      if (!Number.isInteger(grossMinor) || grossMinor < 0 || grossMinor > maxMinor)
        throw new ValidationError(
          'Payroll salaries must be whole minor units between 0 and 2147483647'
        );
      if (grossMinor > maxMinor - totalMinor)
        throw new ValidationError(
          'Payroll total exceeds the supported limit of 2147483647 minor units'
        );
      totalMinor += grossMinor;
      return { ...ownership, employeeId: employee.id, grossMinor, netMinor: grossMinor };
    });
    const run = await tx.payrollRun.create({
      data: {
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        ...ownership,
        status: 'DRAFT',
        totalMinor,
      },
    });
    if (employees.length) {
      await tx.payrollItem.createMany({
        data: items.map((item) => ({ ...item, payrollRunId: run.id })),
      });
    }
    await tx.auditLog.create({
      data: {
        tenantId: ownership.tenantId,
        actorId: context.actorId,
        action: 'CREATE',
        entityType: 'PayrollRun',
        entityId: run.id,
        metadata: {
          schoolId: ownership.schoolId,
          toStatus: 'DRAFT',
          totalMinor,
          itemCount: items.length,
        },
      },
    });
    return run;
  });
}

export async function finalizePayrollRun(context, id) {
  const ownership = scope(context);
  if (!context.actorId) throw new AuthorizationError('Payroll actor identity is required');
  try {
    return await prisma.$transaction(
      async (tx) => {
        const run = await tx.payrollRun.findFirst({ where: { id, ...ownership, status: 'DRAFT' } });
        if (!run) throw new ConflictError('Payroll run was not found or is already finalized');
        const items = await tx.payrollItem.findMany({ where: { payrollRunId: id, ...ownership } });
        const validAmount = (value) => Number.isInteger(value) && value >= 0 && value <= 2147483647;
        let totalMinor = 0;
        const employeeIds = new Set();
        for (const item of items) {
          if (
            !validAmount(item.grossMinor) ||
            !validAmount(item.deductionsMinor) ||
            !validAmount(item.netMinor) ||
            item.grossMinor - item.deductionsMinor !== item.netMinor ||
            item.status !== 'PENDING' ||
            employeeIds.has(item.employeeId)
          )
            throw new ValidationError('Payroll draft contains invalid or duplicate items');
          employeeIds.add(item.employeeId);
          totalMinor += item.netMinor;
          if (!validAmount(totalMinor))
            throw new ValidationError('Payroll draft total exceeds the supported limit');
        }
        if (!validAmount(run.totalMinor) || run.totalMinor !== totalMinor)
          throw new ValidationError('Payroll draft total does not match its items');
        const employeeCount = await tx.employee.count({
          where: { ...ownership, id: { in: [...employeeIds] } },
        });
        if (employeeCount !== employeeIds.size)
          throw new ValidationError('Payroll draft contains an employee outside the active school');
        const processedAt = new Date();
        const result = await tx.payrollRun.updateMany({
          where: { id, ...ownership, status: 'DRAFT', totalMinor: run.totalMinor },
          data: { status: 'FINALIZED', processedAt },
        });
        if (!result.count)
          throw new ConflictError('Payroll draft changed; reload before finalizing');
        await tx.auditLog.create({
          data: {
            tenantId: ownership.tenantId,
            actorId: context.actorId,
            action: 'UPDATE',
            entityType: 'PayrollRun',
            entityId: id,
            metadata: {
              schoolId: ownership.schoolId,
              fromStatus: 'DRAFT',
              toStatus: 'FINALIZED',
              totalMinor,
              itemCount: items.length,
            },
          },
        });
        return { ...run, status: 'FINALIZED', processedAt };
      },
      { isolationLevel: 'Serializable' }
    );
  } catch (error) {
    if (error.code === 'P2034')
      throw new ConflictError('Payroll draft changed; reload before finalizing');
    throw error;
  }
}

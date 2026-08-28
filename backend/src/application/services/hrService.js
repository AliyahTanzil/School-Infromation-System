import prisma from '../../infrastructure/orm/prismaClient.js';
import ConflictError from '../../shared/errors/ConflictError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const scope = ({ tenantId, schoolId }) => ({ tenantId, schoolId });

export async function dashboard({ tenantId, schoolId }) {
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
  return prisma.employee.findMany({
    where: { tenantId, schoolId, ...(status ? { status } : {}) },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
  });
}

export async function createEmployee(context, data) {
  const ownership = scope(context);
  const references = [
    data.departmentId
      ? prisma.hRDepartment.count({ where: { id: data.departmentId, ...ownership, active: true } })
      : Promise.resolve(1),
    data.positionId
      ? prisma.hRPosition.count({ where: { id: data.positionId, ...ownership, active: true } })
      : Promise.resolve(1),
  ];
  const [departmentExists, positionExists] = await Promise.all(references);
  if (!departmentExists || !positionExists)
    throw new ValidationError('Department or position is outside the active school context');
  return prisma.employee.create({
    data: { ...ownership, emergencyContact: {}, status: 'APPLICANT', ...data },
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
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, ...ownership },
  });
  if (!employee) throw new NotFoundError('Employee not found');
  return prisma.leaveRequest.create({ data: { ...ownership, status: 'PENDING', ...data } });
}

export async function approveLeave({ tenantId, schoolId, id, approvedById, status }) {
  const result = await prisma.leaveRequest.updateMany({
    where: { id, tenantId, schoolId, status: 'PENDING' },
    data: { status, approvedById, approvedAt: new Date() },
  });
  if (!result.count) throw new NotFoundError('Leave request not found or already decided');
  return prisma.leaveRequest.findFirst({ where: { id, tenantId, schoolId } });
}

export async function createPayrollRun(context, data) {
  const ownership = scope(context);
  return prisma.$transaction(async (tx) => {
    const employees = await tx.employee.findMany({
      where: { ...ownership, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
    });
    const positionIds = [...new Set(employees.map((item) => item.positionId).filter(Boolean))];
    const positions = await tx.hRPosition.findMany({
      where: { ...ownership, id: { in: positionIds } },
    });
    const salaries = new Map(positions.map((item) => [item.id, item.salaryMinor]));
    const totalMinor = employees.reduce(
      (sum, item) => sum + (salaries.get(item.positionId) ?? 0),
      0
    );
    const run = await tx.payrollRun.create({ data: { ...ownership, ...data, totalMinor } });
    if (employees.length) {
      await tx.payrollItem.createMany({
        data: employees.map((employee) => {
          const grossMinor = salaries.get(employee.positionId) ?? 0;
          return {
            ...ownership,
            payrollRunId: run.id,
            employeeId: employee.id,
            grossMinor,
            netMinor: grossMinor,
          };
        }),
      });
    }
    return run;
  });
}

export async function finalizePayrollRun(context, id) {
  const ownership = scope(context);
  const result = await prisma.payrollRun.updateMany({
    where: { id, ...ownership, status: 'DRAFT' },
    data: { status: 'FINALIZED', processedAt: new Date() },
  });
  if (!result.count) throw new ConflictError('Payroll run was not found or is already finalized');
  return prisma.payrollRun.findFirst({ where: { id, ...ownership } });
}

import prisma from '../../infrastructure/orm/prismaClient.js';

export async function dashboard({ tenantId, schoolId }) {
  const [employees, pendingLeave, payrollRuns, departments] = await Promise.all([
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
  ]);
  return { employees, pendingLeave, payrollRuns, departments };
}

export async function listEmployees({ tenantId, schoolId, status }) {
  return prisma.employee.findMany({
    where: { tenantId, schoolId, ...(status ? { status } : {}) },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 100,
    include: { department: true, position: true },
  });
}

export async function createEmployee({ tenantId, schoolId, ...data }) {
  return prisma.employee.create({
    data: { tenantId, schoolId, emergencyContact: {}, status: 'APPLICANT', ...data },
  });
}

export async function requestLeave({ tenantId, schoolId, ...data }) {
  return prisma.leaveRequest.create({ data: { tenantId, schoolId, status: 'PENDING', ...data } });
}

export async function approveLeave({ tenantId, schoolId, id, approvedById, status }) {
  const result = await prisma.leaveRequest.updateMany({
    where: { id, tenantId, schoolId, status: 'PENDING' },
    data: { status, approvedById, approvedAt: new Date() },
  });
  if (!result.count)
    throw Object.assign(new Error('Leave request not found or already decided'), {
      statusCode: 404,
    });
  return prisma.leaveRequest.findUnique({ where: { id } });
}

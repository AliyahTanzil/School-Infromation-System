import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  assertAcademicPeriodRange,
  assertAcademicTransition,
  isLocked,
} from '../../domain/academicPeriodLifecycle.js';

export async function listAcademicPeriods({ tenantId, schoolId, type, status }) {
  return prisma.academicPeriod.findMany({
    where: { tenantId, schoolId, ...(type ? { type } : {}), ...(status ? { status } : {}) },
    orderBy: [{ startsAt: 'asc' }, { name: 'asc' }],
    include: { children: true },
  });
}

export async function createAcademicPeriod({ tenantId, schoolId, actorId, data }) {
  assertAcademicPeriodRange(data.startsAt, data.endsAt);
  const overlap = await prisma.academicPeriod.findFirst({
    where: { schoolId, startsAt: { lt: data.endsAt }, endsAt: { gt: data.startsAt } },
  });
  if (overlap) throw new Error('Academic period overlaps an existing period');
  return prisma.academicPeriod.create({
    data: { ...data, tenantId, schoolId, history: { create: { toStatus: 'PLANNED', actorId } } },
  });
}

export async function changeAcademicPeriodStatus({
  tenantId,
  schoolId,
  actorId,
  id,
  status,
  reason,
}) {
  const period = await prisma.academicPeriod.findFirstOrThrow({
    where: { id, tenantId, schoolId },
  });
  assertAcademicTransition(period.status, status);
  if (isLocked(period) && status !== 'ARCHIVED')
    throw new Error('Locked academic periods cannot be changed');
  return prisma.academicPeriod.update({
    where: { id },
    data: {
      status,
      lockedAt: status === 'CLOSED' ? new Date() : period.lockedAt,
      history: { create: { fromStatus: period.status, toStatus: status, reason, actorId } },
    },
  });
}

export default { listAcademicPeriods, createAcademicPeriod, changeAcademicPeriodStatus };

import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  assertAcademicPeriodRange,
  assertAcademicTransition,
} from '../../domain/academicPeriodLifecycle.js';

const toDto = (period, type) => ({
  id: period.id,
  tenantId: period.tenantId,
  name: period.name,
  code: period.code ?? period.name,
  type,
  status: type === 'YEAR' ? (period.isCurrent ? 'ACTIVE' : 'PLANNED') : 'PLANNED',
  startsAt: period.startsOn,
  endsAt: period.endsOn,
  parentId: type === 'TERM' ? period.academicYearId : null,
});

export async function listAcademicPeriods({ tenantId, type, status }) {
  const includeYears = !type || type === 'YEAR';
  const includeTerms = !type || type === 'TERM';
  const [years, terms] = await Promise.all([
    includeYears
      ? prisma.academicYear.findMany({ where: { tenantId }, orderBy: { startsOn: 'asc' } })
      : [],
    includeTerms
      ? prisma.academicTerm.findMany({
          where: { academicYear: { tenantId } },
          orderBy: { startsOn: 'asc' },
        })
      : [],
  ]);
  return [
    ...years.map((period) => toDto(period, 'YEAR')),
    ...terms.map((period) => toDto(period, 'TERM')),
  ]
    .filter((period) => !status || period.status === status)
    .sort((a, b) => a.startsAt - b.startsAt);
}

export async function createAcademicPeriod({ tenantId, data }) {
  assertAcademicPeriodRange(data.startsAt, data.endsAt);
  if (data.type === 'YEAR') {
    const year = await prisma.academicYear.create({
      data: {
        tenantId,
        name: data.name,
        startsOn: data.startsAt,
        endsOn: data.endsAt,
        isCurrent: false,
      },
    });
    return toDto({ ...year, code: data.code ?? data.name }, 'YEAR');
  }
  if (!data.parentId) throw new Error('parentId is required for a term');
  const year = await prisma.academicYear.findFirst({ where: { id: data.parentId, tenantId } });
  if (!year) throw new Error('Academic year not found in tenant');
  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: year.id,
      name: data.name,
      startsOn: data.startsAt,
      endsOn: data.endsAt,
    },
  });
  return toDto({ ...term, code: data.code ?? data.name }, 'TERM');
}

export async function changeAcademicPeriodStatus({ tenantId, id, status }) {
  const year = await prisma.academicYear.findFirst({ where: { id, tenantId } });
  if (year) {
    const current = year.isCurrent ? 'ACTIVE' : 'PLANNED';
    assertAcademicTransition(current, status);
    const updated = await prisma.academicYear.update({
      where: { id },
      data: { isCurrent: status === 'ACTIVE' },
    });
    return toDto(updated, 'YEAR');
  }
  const term = await prisma.academicTerm.findFirst({ where: { id, academicYear: { tenantId } } });
  if (!term) throw new Error('Academic period not found');
  if (status === 'CLOSED')
    throw new Error('Terms cannot be closed until result locking is implemented');
  return toDto(term, 'TERM');
}

export default { listAcademicPeriods, createAcademicPeriod, changeAcademicPeriodStatus };

import prisma from '../../infrastructure/orm/prismaClient.js';
import {
  assertAcademicPeriodRange,
  assertAcademicTransition,
} from '../../domain/academicPeriodLifecycle.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const toDto = (period, type) => ({
  id: period.id,
  tenantId: period.tenantId,
  name: period.name,
  code: period.code ?? period.name,
  type,
  status:
    type === 'YEAR' ? (period.isCurrent ? 'ACTIVE' : 'PLANNED') : (period.status ?? 'PLANNED'),
  startsAt: period.startsOn ?? period.startsAt,
  endsAt: period.endsOn ?? period.endsAt,
  parentId: type === 'TERM' ? period.academicYearId : null,
  description: period.description ?? null,
});

export async function listAcademicPeriods({ tenantId, schoolId, type, status }) {
  const [years, terms, events] = await Promise.all([
    !type || type === 'YEAR'
      ? prisma.academicYear.findMany({ where: { tenantId }, orderBy: { startsOn: 'asc' } })
      : [],
    !type || type === 'TERM'
      ? prisma.academicTerm.findMany({
          where: { academicYear: { tenantId } },
          orderBy: { startsOn: 'asc' },
        })
      : [],
    !type || ['BREAK', 'EXAM', 'EVENT'].includes(type)
      ? prisma.academicCalendarEvent.findMany({
          where: { tenantId, schoolId, ...(type ? { type } : {}) },
          orderBy: { startsAt: 'asc' },
        })
      : [],
  ]);
  return [
    ...years.map((item) => toDto(item, 'YEAR')),
    ...terms.map((item) => toDto(item, 'TERM')),
    ...events.map((item) => toDto(item, item.type)),
  ]
    .filter((item) => !status || item.status === status)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
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
  if (!data.parentId) throw new ValidationError('Academic year is required for a term');
  const year = await prisma.academicYear.findFirst({ where: { id: data.parentId, tenantId } });
  if (!year) throw new NotFoundError('Academic year not found');
  if (data.startsAt < year.startsOn || data.endsAt > year.endsOn)
    throw new ValidationError('Term dates must be inside the selected academic year');
  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: year.id,
      name: data.name,
      startsOn: data.startsAt,
      endsOn: data.endsAt,
      status: 'PLANNED',
    },
  });
  return toDto({ ...term, code: data.code ?? data.name }, 'TERM');
}

export async function createAcademicEvent({ tenantId, schoolId, actorId, data }) {
  const event = await prisma.academicCalendarEvent.create({
    data: { ...data, tenantId, schoolId, createdById: actorId, status: 'PLANNED' },
  });
  return toDto(event, event.type);
}

export async function changeAcademicPeriodStatus({ tenantId, schoolId, id, status }) {
  const year = await prisma.academicYear.findFirst({ where: { id, tenantId } });
  if (year) {
    assertAcademicTransition(year.isCurrent ? 'ACTIVE' : 'PLANNED', status);
    return prisma.$transaction(async (tx) => {
      if (status === 'ACTIVE')
        await tx.academicYear.updateMany({
          where: { tenantId, isCurrent: true },
          data: { isCurrent: false },
        });
      const updated = await tx.academicYear.update({
        where: { id, tenantId },
        data: { isCurrent: status === 'ACTIVE' },
      });
      return toDto(updated, 'YEAR');
    });
  }
  const term = await prisma.academicTerm.findFirst({ where: { id, academicYear: { tenantId } } });
  if (term) {
    assertAcademicTransition(term.status, status);
    return toDto(
      await prisma.academicTerm.update({
        where: { id, academicYear: { tenantId } },
        data: { status },
      }),
      'TERM'
    );
  }
  const event = await prisma.academicCalendarEvent.findFirst({ where: { id, tenantId, schoolId } });
  if (!event) throw new NotFoundError('Academic period not found');
  assertAcademicTransition(event.status, status);
  const updated = await prisma.academicCalendarEvent.update({
    where: { id, tenantId, schoolId },
    data: { status },
  });
  return toDto(updated, updated.type);
}

export default {
  listAcademicPeriods,
  createAcademicPeriod,
  createAcademicEvent,
  changeAcademicPeriodStatus,
};

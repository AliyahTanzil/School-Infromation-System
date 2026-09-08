import { generateRecordCode } from '../../shared/utils/recordCode.js';
import * as repository from '../../infrastructure/repositories/subjectRepository.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

export const list = (context, filters) => repository.list(context, filters);
export async function get(id, context) {
  const subject = await repository.find(id, context);
  if (!subject) throw new NotFoundError('Subject not found');
  return subject;
}
export async function create(input, context) {
  const { classAssignments, ...subjectInput } = input;
  const uniqueAssignments = [
    ...new Map(classAssignments.map((item) => [item.classId, item])).values(),
  ];
  const db = repository.getClient();
  return db.$transaction(async (tx) => {
    const classes = await tx.class.findMany({
      where: {
        id: { in: uniqueAssignments.map((item) => item.classId) },
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (classes.length !== uniqueAssignments.length) {
      throw new NotFoundError('One or more selected classes were not found in this school');
    }
    return repository.create(
      {
        ...subjectInput,
        code: subjectInput.code || generateRecordCode('SUB', context.schoolId, [subjectInput.name]),
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        classes: {
          create: uniqueAssignments.map((assignment) => ({
            classId: assignment.classId,
            teachingFocus: assignment.teachingFocus || null,
          })),
        },
      },
      tx
    );
  });
}
export async function update(id, input, context) {
  const { classAssignments, ...fields } = input;
  return repository.getClient().$transaction(async (tx) => {
    const subject = await tx.subject.findFirst({
      where: { id, tenantId: context.tenantId, schoolId: context.schoolId, deletedAt: null },
    });
    if (!subject) throw new NotFoundError('Subject not found');
    if (classAssignments !== undefined) {
      const assignments = [
        ...new Map(classAssignments.map((item) => [item.classId, item])).values(),
      ];
      const classes = await tx.class.findMany({
        where: {
          id: { in: assignments.map((item) => item.classId) },
          tenantId: context.tenantId,
          schoolId: context.schoolId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (classes.length !== assignments.length) {
        throw new NotFoundError('One or more selected classes were not found in this school');
      }
      fields.classes = {
        deleteMany: {},
        create: assignments.map((item) => ({
          classId: item.classId,
          teachingFocus: item.teachingFocus || null,
        })),
      };
    }
    return repository.update(id, context, fields, tx);
  });
}
export async function remove(id, context) {
  await get(id, context);
  return repository.update(id, context, { deletedAt: new Date(), status: 'ARCHIVED' });
}
export async function changeStatus(id, status, context) {
  await get(id, context);
  return repository.update(id, context, { status });
}

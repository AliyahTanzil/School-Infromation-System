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
  await get(id, context);
  return repository.update(id, context, input);
}
export async function changeStatus(id, status, context) {
  await get(id, context);
  return repository.update(id, context, { status });
}

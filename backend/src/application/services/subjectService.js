import { generateRecordCode } from '../../shared/utils/recordCode.js';
import * as repository from '../../infrastructure/repositories/subjectRepository.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

export const list = (context, filters) => repository.list(context, filters);
export async function get(id, context) {
  const subject = await repository.find(id, context);
  if (!subject) throw new NotFoundError('Subject not found');
  return subject;
}
export const create = (input, context) =>
  repository.create({
    ...input,
    code: input.code || generateRecordCode('SUB', context.schoolId, [input.name]),
    tenantId: context.tenantId,
    schoolId: context.schoolId,
  });
export async function update(id, input, context) {
  await get(id, context);
  return repository.update(id, context, input);
}
export async function changeStatus(id, status, context) {
  await get(id, context);
  return repository.update(id, context, { status });
}

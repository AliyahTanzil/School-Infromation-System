import prisma from '../../infrastructure/orm/prismaClient.js';
import repository from '../../infrastructure/repositories/studentRepository.js';

const transitions = {
  APPLICANT: ['ADMITTED', 'WITHDRAWN'],
  ADMITTED: ['ACTIVE', 'WITHDRAWN'],
  ACTIVE: ['TRANSFERRED', 'GRADUATED', 'WITHDRAWN', 'SUSPENDED'],
  SUSPENDED: ['ACTIVE', 'WITHDRAWN'],
  TRANSFERRED: ['ACTIVE', 'WITHDRAWN'],
  GRADUATED: [],
  WITHDRAWN: [],
};

function ensureContext(context) {
  if (!context?.tenantId || !context?.schoolId)
    throw Object.assign(new Error('Trusted school context is required'), { statusCode: 403 });
}

export async function create(input, context) {
  ensureContext(context);
  return prisma.$transaction(async (tx) =>
    repository.create({ ...input, tenantId: context.tenantId, schoolId: context.schoolId }, tx)
  );
}

export function list(query, context) {
  ensureContext(context);
  return repository.list({ ...query, tenantId: context.tenantId, schoolId: context.schoolId });
}
export function get(id, context) {
  ensureContext(context);
  return repository.findById(id, context.schoolId, context.tenantId);
}

export async function update(id, input, context) {
  ensureContext(context);
  const existing = await repository.findById(id, context.schoolId, context.tenantId);
  if (!existing) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  return repository.update(id, context.schoolId, context.tenantId, input);
}

export async function changeStatus(id, nextStatus, reason, context, actorId) {
  ensureContext(context);
  return prisma.$transaction(async (tx) => {
    const student = await repository.findById(id, context.schoolId, context.tenantId, tx);
    if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
    if (!transitions[student.status]?.includes(nextStatus))
      throw Object.assign(
        new Error(`Invalid student transition: ${student.status} -> ${nextStatus}`),
        { statusCode: 422 }
      );
    const updated = await repository.updateStatus(
      id,
      context.schoolId,
      context.tenantId,
      nextStatus,
      tx
    );
    await repository.addHistory(
      { studentId: id, fromStatus: student.status, toStatus: nextStatus, reason, actorId },
      tx
    );
    return updated;
  });
}

export async function addGuardian(studentId, guardian, link, context) {
  ensureContext(context);
  const student = await repository.findById(studentId, context.schoolId, context.tenantId);
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  return prisma.$transaction(async (tx) => {
    const created = await repository.createGuardian(
      { ...guardian, tenantId: context.tenantId, schoolId: context.schoolId },
      tx
    );
    return repository.addGuardian(studentId, created.id, link, tx);
  });
}

export async function updateMedical(studentId, data, context) {
  ensureContext(context);
  const student = await repository.findById(studentId, context.schoolId, context.tenantId);
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  return repository.updateMedical(studentId, data);
}

export default { create, list, get, update, changeStatus, addGuardian, updateMedical };

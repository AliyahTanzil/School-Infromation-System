import * as repository from '../../infrastructure/repositories/teacherRepository.js';
import { assertTransition } from '../../domain/teacherLifecycle.js';

export async function list(context, filters) {
  return repository.listTeachers({ ...context, ...filters });
}
export async function get(id, context) {
  return repository.findTeacher(id, context);
}
export async function create(input, context) {
  return repository.createTeacher({
    tenantId: context.tenantId,
    schoolId: context.schoolId,
    employeeNumber: input.employeeNumber,
    status: 'APPLICANT',
    profile: { create: input.profile },
    employment: input.employment ? { create: input.employment } : undefined,
  });
}
export async function changeStatus(id, input, context) {
  const teacher = await repository.findTeacher(id, context);
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }
  assertTransition(teacher.status, input.status);
  await repository.updateTeacher(id, context, { status: input.status });
  await repository.addHistory({
    teacherId: id,
    fromStatus: teacher.status,
    toStatus: input.status,
    reason: input.reason,
    actorId: context.userId,
  });
  return repository.findTeacher(id, context);
}

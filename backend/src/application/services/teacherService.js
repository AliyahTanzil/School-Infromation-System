import * as repository from '../../infrastructure/repositories/teacherRepository.js';
import { assertTransition } from '../../domain/teacherLifecycle.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

export async function list(context, filters) {
  return repository.listTeachers({ ...context, ...filters });
}
export async function get(id, context) {
  return repository.findTeacher(id, context);
}
export async function getMe(userId, tenantId) {
  const teacher = await repository.findTeacherByUser(userId, tenantId);
  if (!teacher) throw new NotFoundError('Teacher profile not found');
  return teacher;
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
  if (!teacher) throw new NotFoundError('Teacher not found');
  assertTransition(teacher.status, input.status);
  return repository.changeStatus(teacher, context, input);
}

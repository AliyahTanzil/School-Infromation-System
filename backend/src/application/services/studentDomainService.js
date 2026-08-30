import { randomUUID } from 'node:crypto';
import studentRepository from '../../infrastructure/repositories/studentDomainRepository.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const clean = (value) => (typeof value === 'string' ? value.trim() : value);
const studentFields = (input) => {
  const admissionNumber = clean(input.admissionNumber);
  const firstName = clean(input.firstName);
  const lastName = clean(input.lastName);
  if (!admissionNumber || !firstName || !lastName)
    throw new ValidationError('admissionNumber, firstName, and lastName are required');
  return {
    admissionNumber,
    firstName,
    lastName,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    gender: input.gender || 'UNSPECIFIED',
    email: clean(input.email) || null,
    phone: clean(input.phone) || null,
  };
};

const serialize = (student) => ({
  id: student.id,
  admissionNumber: student.admissionNumber,
  firstName: student.firstName,
  lastName: student.lastName,
  dateOfBirth: student.dateOfBirth,
  gender: student.gender,
  email: student.email,
  phone: student.phone,
  guardians:
    student.guardians?.map(({ guardian, relationship, isPrimary }) => ({
      ...guardian,
      relationship,
      isPrimary,
    })) ?? [],
  enrollments: student.enrollments ?? [],
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

export async function list({ tenantId, search, page = 1, pageSize = 25 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 25));
  const [total, students] = await studentRepository.listStudents({
    tenantId,
    search,
    page: safePage,
    pageSize: safePageSize,
  });
  return {
    items: students.map(serialize),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
    },
  };
}

export async function get({ tenantId, id }) {
  const student = await studentRepository.findStudent(tenantId, id);
  if (!student) throw new NotFoundError('Student not found');
  return serialize(student);
}

export async function create({ tenantId, input }) {
  const student = await studentRepository.createStudent({
    id: randomUUID(),
    tenantId,
    ...studentFields(input),
  });
  return serialize(student);
}

export async function update({ tenantId, id, input }) {
  await get({ tenantId, id });
  const data = studentFields(input);
  return serialize(await studentRepository.updateStudent(tenantId, id, data));
}

export async function addGuardian({ tenantId, studentId, input }) {
  await get({ tenantId, id: studentId });
  const relationship = clean(input.relationship);
  if (!relationship) throw new ValidationError('relationship is required');
  if (input.guardianId) {
    const guardian = await studentRepository.findGuardian(tenantId, input.guardianId);
    if (!guardian) throw new NotFoundError('Guardian not found');
    await studentRepository.linkExistingGuardian(
      studentId,
      guardian.id,
      relationship,
      Boolean(input.isPrimary)
    );
  } else {
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName)
      throw new ValidationError('Guardian firstName and lastName are required');
    await studentRepository.createGuardianLink(tenantId, studentId, {
      guardian: {
        id: randomUUID(),
        firstName,
        lastName,
        email: clean(input.email) || null,
        phone: clean(input.phone) || null,
      },
      relationship,
      isPrimary: Boolean(input.isPrimary),
    });
  }
  return get({ tenantId, id: studentId });
}

export default { list, get, create, update, addGuardian };

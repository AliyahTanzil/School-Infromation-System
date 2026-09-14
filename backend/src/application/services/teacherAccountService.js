import ConflictError from '../../shared/errors/ConflictError.js';

// The caller supplies a transaction and a server-resolved school, never client ownership.
export async function ensureTeacherAccount(tx, user, schoolId) {
  if (
    !user?.id ||
    !user.tenantId ||
    !schoolId ||
    user.accountType !== 'TEACHER' ||
    user.deletedAt
  ) {
    throw new ConflictError('A school-owned teacher account is required');
  }
  const school = await tx.school.findFirst({ where: { id: schoolId, tenantId: user.tenantId } });
  if (!school) throw new ConflictError('Teacher account does not belong to this school');
  const linked = await tx.teacher.findUnique({ where: { userId: user.id } });
  if (linked) {
    if (linked.tenantId !== user.tenantId || linked.schoolId !== schoolId) {
      throw new ConflictError('Teacher account is already linked to another school');
    }
    return { action: 'existing', teacher: linked };
  }
  const scope = { tenantId: user.tenantId, schoolId };
  const matches = await tx.teacher.findMany({
    where: { ...scope, profile: { email: { equals: user.email, mode: 'insensitive' } } },
    take: 2,
  });
  if (matches.length) {
    const teacher = matches[0];
    if (matches.length !== 1 || teacher.userId || teacher.deletedAt) {
      throw new ConflictError('Existing teacher profile needs manual account reconciliation');
    }
    const result = await tx.teacher.updateMany({
      where: { id: teacher.id, ...scope, userId: null, deletedAt: null },
      data: { userId: user.id },
    });
    if (result.count !== 1) throw new ConflictError('Teacher profile changed during linking');
    return { action: 'linked', teacher: { ...teacher, userId: user.id } };
  }
  const teacher = await tx.teacher.create({
    data: {
      ...scope,
      userId: user.id,
      employeeNumber: `T-${user.id}`,
      status: user.status === 'ACTIVE' ? 'ACTIVE' : 'APPLICANT',
      profile: {
        create: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      },
    },
  });
  return { action: 'created', teacher };
}

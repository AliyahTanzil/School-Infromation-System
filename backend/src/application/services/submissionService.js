import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const isAdministrator = (roles = []) =>
  roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');
const isStaff = (roles = []) => isAdministrator(roles) || roles.includes('TEACHER');

async function requireAssignment(scope, assignmentId, userId, roles, options = {}, db = prisma) {
  const assignment = await db.assignment.findFirst({
    where: { id: assignmentId, ...owned(scope), status: { not: 'ARCHIVED' } },
    include: {
      classroom: { include: { memberships: { where: { userId, status: 'ACTIVE' } } } },
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found');
  const membership = assignment.classroom.memberships[0];
  const ownsClassroom = assignment.classroom.ownerId === userId;
  if (!isAdministrator(roles) && !ownsClassroom && !membership) {
    throw new AuthorizationError('You are not a member of this classroom');
  }
  if (
    options.staffOnly &&
    !isAdministrator(roles) &&
    !ownsClassroom &&
    membership?.role !== 'TEACHER'
  ) {
    throw new AuthorizationError('Only classroom teachers can review submissions');
  }
  if (options.studentOnly && membership?.role !== 'STUDENT') {
    throw new AuthorizationError('An active student classroom membership is required');
  }
  return assignment;
}

export async function list(scope, userId, roles = [], assignmentId) {
  if (isStaff(roles)) {
    if (!assignmentId)
      throw new ValidationError('assignmentId is required for staff submission lists');
    await requireAssignment(scope, assignmentId, userId, roles, { staffOnly: true });
  } else if (assignmentId) {
    await requireAssignment(scope, assignmentId, userId, roles);
  }
  return prisma.studentSubmission.findMany({
    where: {
      ...owned(scope),
      ...(isStaff(roles) ? {} : { studentId: userId }),
      ...(assignmentId ? { assignmentId } : {}),
    },
    include: {
      assignment: {
        select: { id: true, title: true, dueAt: true, points: true, classroomId: true },
      },
      versions: { orderBy: { version: 'desc' }, take: 25 },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function saveVersion(scope, userId, roles, data) {
  const assignment = await requireAssignment(scope, data.assignmentId, userId, roles, {
    studentOnly: true,
  });
  if (assignment.status !== 'PUBLISHED') {
    throw new ValidationError('Only published assignments accept submissions');
  }
  if (data.attachments.length) {
    const materialIds = [...new Set(data.attachments.map((item) => item.materialId))];
    const materialCount = await prisma.digitalMaterial.count({
      where: {
        id: { in: materialIds },
        ...owned(scope),
        classroomId: assignment.classroomId,
        status: 'ACTIVE',
      },
    });
    if (materialCount !== materialIds.length) {
      throw new ValidationError('An attachment is outside the assignment classroom');
    }
  }

  return prisma.$transaction(
    async (tx) => {
      const current = await tx.studentSubmission.findUnique({
        where: {
          tenantId_schoolId_assignmentId_studentId: {
            ...owned(scope),
            assignmentId: data.assignmentId,
            studentId: userId,
          },
        },
      });
      if (current?.status === 'SUBMITTED') {
        throw new ValidationError('Retract the submitted work before creating another version');
      }
      const latest = current
        ? await tx.submissionVersion.findFirst({
            where: { submissionId: current.id },
            orderBy: { version: 'desc' },
            select: { version: true },
          })
        : null;
      const submission = current
        ? await tx.studentSubmission.update({
            where: { id: current.id },
            data: {
              status: data.status,
              submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
            },
          })
        : await tx.studentSubmission.create({
            data: {
              ...owned(scope),
              assignmentId: data.assignmentId,
              studentId: userId,
              status: data.status,
              submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
            },
          });
      await tx.submissionVersion.create({
        data: {
          ...owned(scope),
          submissionId: submission.id,
          version: (latest?.version ?? 0) + 1,
          body: data.body,
          attachments: data.attachments,
        },
      });
      return tx.studentSubmission.findUnique({
        where: { id: submission.id },
        include: { versions: { orderBy: { version: 'desc' }, take: 25 } },
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

export async function updateStatus(scope, id, userId, roles, status) {
  const submission = await prisma.studentSubmission.findFirst({
    where: { id, ...owned(scope), studentId: userId },
    include: { assignment: true },
  });
  if (!submission) throw new NotFoundError('Submission not found');
  await requireAssignment(scope, submission.assignmentId, userId, roles, { studentOnly: true });
  if (submission.status !== 'SUBMITTED' || status !== 'DRAFT') {
    throw new ValidationError(`Submission cannot move from ${submission.status} to ${status}`);
  }
  if (submission.assignment.status !== 'PUBLISHED') {
    throw new ValidationError('This assignment no longer accepts retractions');
  }
  return prisma.studentSubmission.update({
    where: { id },
    data: { status: 'DRAFT', submittedAt: null },
  });
}

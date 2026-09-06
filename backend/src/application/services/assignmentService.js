import prisma from '../../infrastructure/orm/prismaClient.js';
import communicationService from './communicationService.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';
import {
  learnerAssignmentVisibility,
  managesClassroom,
} from '../../domain/assignmentVisibility.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const admin = (roles = []) => roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');
const transitions = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['CLOSED', 'ARCHIVED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
};

async function requireClassroom(
  scope,
  classroomId,
  userId,
  roles,
  teacherOnly = false,
  db = prisma
) {
  const classroom = await db.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: 'ACTIVE' },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (admin(roles) || classroom.ownerId === userId) return classroom;
  const membership = classroom.memberships[0];
  if (!membership) throw new AuthorizationError('You are not a member of this classroom');
  if (teacherOnly && membership.role !== 'TEACHER') {
    throw new AuthorizationError('Only classroom teachers can manage classwork');
  }
  return classroom;
}

export async function list(scope, classroomId, userId, roles, status, db = prisma) {
  const classroom = await requireClassroom(scope, classroomId, userId, roles, false, db);
  const canManage = managesClassroom(classroom, userId, roles);
  return db.assignment.findMany({
    where: {
      ...owned(scope),
      classroomId,
      ...(status ? { status } : { status: { not: 'ARCHIVED' } }),
      ...(!canManage ? { AND: [learnerAssignmentVisibility()] } : {}),
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });
}

export async function create(scope, authorId, roles, data) {
  await requireClassroom(scope, data.classroomId, authorId, roles, true);
  if (data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, ...owned(scope), deletedAt: null, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!subject) throw new ValidationError('Subject is outside the selected school');
  }
  if (data.availableAt && data.dueAt && data.dueAt <= data.availableAt) {
    throw new ValidationError('Due date must be after the availability date');
  }
  return prisma.assignment.create({
    data: { ...owned(scope), ...data, authorId },
  });
}

export async function updateStatus(scope, id, actorId, roles, status) {
  const assignment = await prisma.assignment.findFirst({ where: { id, ...owned(scope) } });
  if (!assignment) throw new NotFoundError('Assignment not found');
  await requireClassroom(scope, assignment.classroomId, actorId, roles, true);
  if (!transitions[assignment.status]?.includes(status)) {
    throw new ValidationError(`Assignment cannot move from ${assignment.status} to ${status}`);
  }
  const now = new Date();
  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      status,
      ...(status === 'PUBLISHED' ? { publishedAt: now } : {}),
      ...(status === 'CLOSED' ? { closedAt: now } : {}),
    },
  });
  if (status === 'PUBLISHED') {
    const members = await prisma.digitalClassroomMember.findMany({
      where: { classroomId: assignment.classroomId, ...owned(scope), status: 'ACTIVE' },
      select: { userId: true },
    });
    const recipients = members.map(({ userId }) => userId).filter((userId) => userId !== actorId);
    if (recipients.length) {
      await communicationService.createNotification(scope, {
        userIds: recipients,
        channels: ['IN_APP'],
        eventType: 'LMS_ASSIGNMENT_PUBLISHED',
        aggregateType: 'Assignment',
        aggregateId: updated.id,
        payload: {
          classroomId: updated.classroomId,
          title: updated.title,
          availableAt: updated.availableAt,
          dueAt: updated.dueAt,
        },
      });
    }
  }
  return updated;
}

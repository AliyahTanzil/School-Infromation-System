import prisma from '../../infrastructure/orm/prismaClient.js';
import AuthorizationError from '../../shared/errors/AuthorizationError.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';

const owned = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
const isAdmin = (roles = []) => roles.includes('PLATFORM_ADMIN') || roles.includes('SCHOOL_ADMIN');

async function requireAccess(scope, classroomId, userId, roles, teacherOnly = false) {
  const classroom = await prisma.digitalClassroom.findFirst({
    where: { id: classroomId, ...owned(scope), status: 'ACTIVE' },
    include: { memberships: { where: { userId, status: 'ACTIVE' } } },
  });
  if (!classroom) throw new NotFoundError('Digital classroom not found');
  if (isAdmin(roles) || classroom.ownerId === userId) return classroom;
  const membership = classroom.memberships[0];
  if (!membership) throw new AuthorizationError('You are not a member of this classroom');
  if (teacherOnly && membership.role !== 'TEACHER') {
    throw new AuthorizationError('Only classroom teachers can publish announcements');
  }
  return classroom;
}

export async function listStream(scope, classroomId, userId, roles) {
  await requireAccess(scope, classroomId, userId, roles);
  const where = { ...owned(scope), classroomId, status: 'PUBLISHED' };
  const [announcements, posts] = await Promise.all([
    prisma.classroomAnnouncement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.classroomStreamPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { comments: { orderBy: { createdAt: 'asc' }, take: 100 } },
      take: 100,
    }),
  ]);
  return { announcements, posts };
}

export async function createAnnouncement(scope, classroomId, authorId, roles, data) {
  await requireAccess(scope, classroomId, authorId, roles, true);
  return prisma.classroomAnnouncement.create({
    data: {
      ...owned(scope),
      classroomId,
      authorId,
      ...data,
      publishedAt: data.status === 'DRAFT' ? null : new Date(),
    },
  });
}

export async function createPost(scope, classroomId, authorId, roles, data) {
  await requireAccess(scope, classroomId, authorId, roles);
  return prisma.classroomStreamPost.create({
    data: { ...owned(scope), classroomId, authorId, ...data },
  });
}

export async function addComment(scope, postId, authorId, roles, body) {
  const post = await prisma.classroomStreamPost.findFirst({
    where: { id: postId, ...owned(scope), status: 'PUBLISHED' },
    select: { classroomId: true },
  });
  if (!post) throw new NotFoundError('Classroom stream post not found');
  await requireAccess(scope, post.classroomId, authorId, roles);
  return prisma.classroomStreamComment.create({
    data: { ...owned(scope), postId, authorId, body },
  });
}

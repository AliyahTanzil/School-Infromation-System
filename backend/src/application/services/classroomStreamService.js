import prisma from '../../infrastructure/orm/prismaClient.js';

const scope = ({ tenantId, schoolId, classroomId }) => ({ tenantId, schoolId, classroomId });

export async function listStream({ tenantId, schoolId, classroomId }) {
  const [announcements, posts] = await Promise.all([
    prisma.classroomAnnouncement.findMany({
      where: scope({ tenantId, schoolId, classroomId }),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.classroomStreamPost.findMany({
      where: scope({ tenantId, schoolId, classroomId }),
      orderBy: { createdAt: 'desc' },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    }),
  ]);
  return { announcements, posts };
}

export async function createAnnouncement({
  tenantId,
  schoolId,
  classroomId,
  authorId,
  title,
  body,
  status = 'PUBLISHED',
}) {
  return prisma.classroomAnnouncement.create({
    data: {
      tenantId,
      schoolId,
      classroomId,
      authorId,
      title,
      body,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });
}

export async function createPost({
  tenantId,
  schoolId,
  classroomId,
  authorId,
  body,
  attachments = [],
}) {
  return prisma.classroomStreamPost.create({
    data: { tenantId, schoolId, classroomId, authorId, body, attachments },
  });
}

export async function addComment({ tenantId, schoolId, postId, authorId, body }) {
  const post = await prisma.classroomStreamPost.findFirst({
    where: { id: postId, tenantId, schoolId },
  });
  if (!post) throw new Error('Classroom stream post not found');
  return prisma.classroomStreamComment.create({
    data: { tenantId, schoolId, postId, authorId, body },
  });
}

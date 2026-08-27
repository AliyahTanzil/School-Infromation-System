import prisma from '../../infrastructure/orm/prismaClient.js';

export async function list({ tenantId, schoolId, studentId, assignmentId }) {
  return prisma.studentSubmission.findMany({
    where: {
      tenantId,
      schoolId,
      ...(studentId ? { studentId } : {}),
      ...(assignmentId ? { assignmentId } : {}),
    },
    include: { versions: { orderBy: { version: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function saveVersion({
  tenantId,
  schoolId,
  assignmentId,
  studentId,
  body,
  attachments = [],
  status = 'DRAFT',
}) {
  const current = await prisma.studentSubmission.findUnique({
    where: {
      tenantId_schoolId_assignmentId_studentId: { tenantId, schoolId, assignmentId, studentId },
    },
    include: { versions: true },
  });
  const version =
    (current?.versions?.reduce((max, item) => Math.max(max, item.version), 0) || 0) + 1;
  return prisma.$transaction(async (tx) => {
    const submission = current
      ? await tx.studentSubmission.update({
          where: { id: current.id },
          data: { status, submittedAt: status === 'SUBMITTED' ? new Date() : null },
        })
      : await tx.studentSubmission.create({
          data: {
            tenantId,
            schoolId,
            assignmentId,
            studentId,
            status,
            submittedAt: status === 'SUBMITTED' ? new Date() : null,
          },
        });
    await tx.submissionVersion.create({
      data: { tenantId, schoolId, submissionId: submission.id, version, body, attachments },
    });
    return tx.studentSubmission.findUnique({
      where: { id: submission.id },
      include: { versions: { orderBy: { version: 'desc' } } },
    });
  });
}

export async function updateStatus({ id, tenantId, schoolId, status }) {
  return prisma.studentSubmission.updateMany({
    where: { id, tenantId, schoolId },
    data: { status, submittedAt: status === 'SUBMITTED' ? new Date() : undefined },
  });
}

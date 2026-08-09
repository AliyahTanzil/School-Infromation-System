import prisma from '../../infrastructure/orm/prismaClient.js';
import { calculateResult, nextResultStatus, rankResults } from '../../domain/resultEngine.js';

const where = ({ tenantId, schoolId, id }) => ({ id, tenantId, schoolId });

export async function listResults({ tenantId, schoolId, examinationId }) {
  return prisma.result.findMany({
    where: { tenantId, schoolId, ...(examinationId ? { examinationId } : {}) },
    include: { student: { include: { profile: true } }, subjects: true },
    orderBy: { position: 'asc' },
  });
}

export async function processResults({ tenantId, schoolId, examinationId, schemeId }) {
  const [scheme, marks] = await Promise.all([
    prisma.gradeScheme.findFirst({
      where: { id: schemeId, tenantId, schoolId },
      include: { bands: true },
    }),
    prisma.examinationMark.findMany({
      where: { tenantId, schoolId, examinationId, status: 'APPROVED' },
    }),
  ]);
  if (!scheme) throw new Error('Grading scheme not found');
  const studentIds = [...new Set(marks.map((mark) => mark.studentId))];
  const calculated = studentIds.map((studentId) => ({
    studentId,
    ...calculateResult({
      marks: marks.filter((mark) => mark.studentId === studentId),
      bands: scheme.bands,
      passMark: scheme.passMark,
    }),
  }));
  const ranked = rankResults(calculated);
  await prisma.$transaction(
    ranked.map((item) =>
      prisma.result.upsert({
        where: { examinationId_studentId: { examinationId, studentId: item.studentId } },
        create: {
          tenantId,
          schoolId,
          examinationId,
          studentId: item.studentId,
          schemeId,
          status: 'REVIEW',
          studentStatus: item.studentStatus,
          total: item.total,
          average: item.average,
          grade: item.grade,
          gradePoint: item.gradePoint,
          position: item.position,
          processedAt: new Date(),
        },
        update: {
          schemeId,
          status: 'REVIEW',
          studentStatus: item.studentStatus,
          total: item.total,
          average: item.average,
          grade: item.grade,
          gradePoint: item.gradePoint,
          position: item.position,
          processedAt: new Date(),
        },
      })
    )
  );
  return listResults({ tenantId, schoolId, examinationId });
}

export async function changeStatus({ tenantId, schoolId, id, status, actorId }) {
  const result = await prisma.result.findFirst({ where: where({ tenantId, schoolId, id }) });
  if (!result) throw new Error('Result not found');
  const next = nextResultStatus(result.status, status);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.result.update({
      where: { id },
      data: {
        status: next,
        ...(next === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
        ...(next === 'LOCKED' ? { lockedAt: new Date() } : {}),
      },
    });
    await tx.resultAudit.create({
      data: {
        tenantId,
        schoolId,
        resultId: id,
        actorId,
        action: `STATUS_${next}`,
        metadata: { from: result.status, to: next },
      },
    });
    return updated;
  });
}

export async function getStatistics({ tenantId, schoolId, examinationId }) {
  const results = await listResults({ tenantId, schoolId, examinationId });
  return {
    count: results.length,
    passCount: results.filter((item) => item.studentStatus === 'PASS').length,
    average: results.length
      ? results.reduce((sum, item) => sum + Number(item.average), 0) / results.length
      : 0,
  };
}

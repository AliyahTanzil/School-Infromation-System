import prisma from '../../infrastructure/orm/prismaClient.js';
import { calculateResult, nextResultStatus, rankResults } from '../../domain/resultEngine.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

const scope = ({ tenantId, schoolId }) => ({ tenantId, schoolId });
export const listResults = (context, examinationId) =>
  prisma.result.findMany({
    where: { ...scope(context), ...(examinationId ? { examinationId } : {}) },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
export async function processResults(context, { examinationId, schemeId }, actorId) {
  const [examination, scheme, candidates, marks] = await Promise.all([
    prisma.examination.findFirst({ where: { id: examinationId, ...scope(context) } }),
    prisma.gradeScheme.findFirst({
      where: { id: schemeId, ...scope(context), status: 'ACTIVE', deletedAt: null },
      include: { bands: true },
    }),
    prisma.examinationCandidate.findMany({ where: { examinationId, ...scope(context) } }),
    prisma.examinationMark.findMany({ where: { examinationId, ...scope(context) } }),
  ]);
  if (!examination) throw new NotFoundError('Examination not found');
  if (examination.status !== 'LOCKED')
    throw new ValidationError('Examination must be locked before official result processing');
  if (!scheme) throw new NotFoundError('Active grading scheme not found');
  if (!candidates.length || !marks.length)
    throw new ValidationError('Candidates and marks are required before processing results');
  const calculated = candidates.map((candidate) => ({
    studentId: candidate.studentId,
    ...calculateResult({
      marks: marks
        .filter((mark) => mark.candidateId === candidate.id)
        .map((mark) => ({ score: mark.marks })),
      bands: scheme.bands,
      passMark: scheme.passMark,
    }),
  }));
  const ranked = rankResults(calculated);
  return prisma.$transaction(async (tx) => {
    for (const item of ranked) {
      await tx.result.upsert({
        where: { examinationId_studentId: { examinationId, studentId: item.studentId } },
        create: {
          ...scope(context),
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
          publishedAt: null,
          lockedAt: null,
        },
      });
    }
    await tx.examinationAudit.create({
      data: {
        ...scope(context),
        examinationId,
        actorId,
        action: 'RESULTS_PROCESSED',
        metadata: { schemeId, resultCount: ranked.length },
      },
    });
    return tx.result.findMany({
      where: { ...scope(context), examinationId },
      orderBy: { position: 'asc' },
    });
  });
}
export async function changeStatus(id, context, status, actorId) {
  const result = await prisma.result.findFirst({ where: { id, ...scope(context) } });
  if (!result) throw new NotFoundError('Result not found');
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
        ...scope(context),
        resultId: id,
        actorId,
        action: `STATUS_${next}`,
        metadata: { from: result.status, to: next },
      },
    });
    return updated;
  });
}
export async function getStatistics(context, examinationId) {
  const results = await listResults(context, examinationId);
  return {
    count: results.length,
    passCount: results.filter((item) => item.studentStatus === 'PASS').length,
    average: results.length
      ? results.reduce((sum, item) => sum + Number(item.average), 0) / results.length
      : 0,
  };
}

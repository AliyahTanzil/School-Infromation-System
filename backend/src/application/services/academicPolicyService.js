import * as repository from '../../infrastructure/repositories/academicPolicyRepository.js';
import {
  assertBands,
  assertWeights,
  nextAcademicPolicyStatus,
} from '../../domain/academicPolicy.js';
import NotFoundError from '../../shared/errors/NotFoundError.js';
import ValidationError from '../../shared/errors/ValidationError.js';

export const list = (context, filters = {}) => repository.list(context, filters.status);
export async function get(id, context) {
  const scheme = await repository.find(id, context);
  if (!scheme) throw new NotFoundError('Academic policy not found');
  return scheme;
}
export async function create(input, context) {
  assertBands(input.bands);
  if (input.effectiveTo && input.effectiveTo <= input.effectiveFrom)
    throw new ValidationError('effectiveTo must be after effectiveFrom');
  return repository.create({
    tenantId: context.tenantId,
    schoolId: context.schoolId,
    name: input.name,
    code: input.code,
    passMark: input.passMark,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    bands: { create: input.bands.map((item, index) => ({ ...item, sortOrder: index })) },
    weights: { create: input.weights },
  });
}
export async function changeStatus(id, input, context) {
  const scheme = await get(id, context);
  nextAcademicPolicyStatus(scheme.status, input.status);
  if (input.status === 'ACTIVE') {
    assertBands(scheme.bands);
    assertWeights(scheme.weights);
    const overlap = await repository.prisma.gradeScheme.findFirst({
      where: {
        ...{
          tenantId: context.tenantId,
          schoolId: context.schoolId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        id: { not: id },
        effectiveFrom: { lte: scheme.effectiveTo ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: scheme.effectiveFrom } }],
      },
    });
    if (overlap)
      throw new ValidationError('An active academic policy already covers this effective period');
  }
  return repository.transaction(async (tx) => {
    await tx.gradeSchemeHistory.create({
      data: {
        tenantId: context.tenantId,
        schoolId: context.schoolId,
        schemeId: id,
        actorId: context.userId,
        fromStatus: scheme.status,
        toStatus: input.status,
        reason: input.reason,
      },
    });
    return tx.gradeScheme.update({
      where: { id },
      data: { status: input.status },
      include: {
        bands: { orderBy: { sortOrder: 'desc' } },
        weights: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
  });
}

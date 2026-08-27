import ValidationError from '../shared/errors/ValidationError.js';

export function assertBands(bands) {
  if (!bands?.length) throw new ValidationError('At least one grade band is required');
  const ordered = [...bands].sort((a, b) => Number(a.minMark) - Number(b.minMark));
  if (Number(ordered[0].minMark) !== 0 || Number(ordered.at(-1).maxMark) !== 100)
    throw new ValidationError('Grade bands must cover scores from 0 through 100');
  ordered.forEach((band, index) => {
    if (Number(band.minMark) > Number(band.maxMark))
      throw new ValidationError(`Grade band ${band.label} has an invalid range`);
    if (
      index &&
      Math.abs(Number(band.minMark) - (Number(ordered[index - 1].maxMark) + 0.01)) > 0.0001
    )
      throw new ValidationError('Grade bands must be contiguous and must not overlap');
  });
}

export function assertWeights(weights) {
  if (!weights?.length) throw new ValidationError('At least one assessment weight is required');
  const total = weights.reduce((sum, item) => sum + Number(item.weight), 0);
  if (Math.abs(total - 100) > 0.001)
    throw new ValidationError('Assessment weights must total exactly 100%');
}

export function nextAcademicPolicyStatus(current, requested) {
  const allowed = { DRAFT: ['ACTIVE', 'ARCHIVED'], ACTIVE: ['ARCHIVED'], ARCHIVED: [] };
  if (!allowed[current]?.includes(requested))
    throw new ValidationError(`Invalid academic policy transition: ${current} -> ${requested}`);
  return requested;
}

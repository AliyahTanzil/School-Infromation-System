const transitions = {
  PLANNED: new Set(['ACTIVE', 'ARCHIVED']),
  ACTIVE: new Set(['CLOSED', 'ARCHIVED']),
  CLOSED: new Set(['ARCHIVED']),
  ARCHIVED: new Set(),
};

export function assertAcademicPeriodRange(startsAt, endsAt) {
  if (!(startsAt instanceof Date) || !(endsAt instanceof Date) || startsAt >= endsAt) {
    throw new Error('Academic period end must be after its start');
  }
}

export function assertAcademicTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return;
  if (!transitions[fromStatus]?.has(toStatus)) {
    throw new Error(`Invalid academic period transition: ${fromStatus} -> ${toStatus}`);
  }
}

export function isLocked(period) {
  return Boolean(period.lockedAt) || period.status === 'CLOSED' || period.status === 'ARCHIVED';
}

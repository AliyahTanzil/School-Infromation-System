const transitions = {
  APPLICANT: new Set(['ACTIVE']),
  ACTIVE: new Set(['ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED', 'RETIRED']),
  ON_LEAVE: new Set(['ACTIVE', 'TERMINATED', 'RESIGNED']),
  SUSPENDED: new Set(['ACTIVE', 'TERMINATED']),
  TERMINATED: new Set(),
  RESIGNED: new Set(),
  RETIRED: new Set(),
};

export function canTransition(fromStatus, toStatus) {
  return transitions[fromStatus]?.has(toStatus) ?? false;
}

export function assertTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    const error = new Error(`Invalid teacher status transition: ${fromStatus} -> ${toStatus}`);
    error.statusCode = 422;
    throw error;
  }
}

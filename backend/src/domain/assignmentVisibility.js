export function managesClassroom(classroom, userId, roles = []) {
  return (
    roles.includes('PLATFORM_ADMIN') ||
    roles.includes('SCHOOL_ADMIN') ||
    classroom.ownerId === userId ||
    classroom.memberships?.some(
      (member) =>
        member.userId === userId && member.status === 'ACTIVE' && member.role === 'TEACHER'
    )
  );
}

export function learnerAssignmentVisibility(now = new Date()) {
  return {
    status: { in: ['PUBLISHED', 'CLOSED'] },
    OR: [{ availableAt: null }, { availableAt: { lte: now } }],
  };
}

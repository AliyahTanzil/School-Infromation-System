/**
 * Maps a persistence User record to the safe, public shape returned by the API.
 * Never leaks passwordHash, lockout counters, or soft-delete internals.
 * @param {any} user
 * @param {{ roles?: string[] }} [extra]
 */
export function toPublicUser(user, { roles = [] } = {}) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    roles,
  };
}

export default { toPublicUser };

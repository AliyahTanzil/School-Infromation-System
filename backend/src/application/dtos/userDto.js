/**
 * Maps a persistence User record to the safe, public shape returned by the API.
 * Never leaks passwordHash, lockout counters, or soft-delete internals.
 * @param {any} user
 * @param {{ roles?: string[] }} [extra]
 */
export function toPublicUser(user, { roles = [] } = {}) {
  return {
    id: user.id,
    tenantId: user.tenantId ?? null,
    email: user.email,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    accountType: user.accountType ?? null,
    platformRole: user.platformRole ?? null,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    roles,
  };
}
export function toUserDto(user) {
  if (!user) return null;
  return {
    ...toPublicUser(user, { roles: user.roles?.map(({ role }) => role.code) ?? [] }),
    profile: user.profile ?? null,
    preference: user.preference ?? null,
    roleAssignments:
      user.roles?.map(({ role, expiresAt }) => ({
        code: role.code,
        name: role.name,
        expiresAt,
      })) ?? [],
  };
}

export function toUserListDto(user) {
  const dto = toUserDto(user);
  return (
    dto && {
      id: dto.id,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      accountType: dto.accountType,
      status: dto.status,
      profile: dto.profile,
      roles: dto.roles,
      createdAt: dto.createdAt,
    }
  );
}

export default { toPublicUser, toUserDto, toUserListDto };

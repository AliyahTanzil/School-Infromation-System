import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import authService from '../../src/application/services/authService.js';
import userRepository from '../../src/infrastructure/repositories/userRepository.js';

for (const operation of ['getCurrentUser', 'changePassword']) {
  test(`${operation} rejects missing or malformed identity before account lookup`, async (t) => {
    const lookup = mock.method(userRepository, 'findById', async () => null);
    t.after(() => lookup.mock.restore());
    const fields = operation === 'changePassword' ? ['userId', 'sessionId'] : ['userId'];
    for (const field of fields) {
      for (const value of [undefined, null, '', '   ', 42, {}, []]) {
        await assert.rejects(
          authService[operation]({
            userId: 'authenticated-user',
            sessionId: 'authenticated-session',
            currentPassword: 'current',
            newPassword: 'replacement',
            [field]: value,
          }),
          { statusCode: 401, code: 'AUTHENTICATION_ERROR' }
        );
      }
    }
    assert.equal(lookup.mock.callCount(), 0);
  });
}

import { rolePath } from '../services/auth/state';

const roleTests: Array<[string, string]> = [
  ['owner', '/owner'],
  ['tenant', '/tenant'],
  ['administrator', '/administrator'],
  ['staff', '/staff'],
];

for (const [role, expectedPath] of roleTests) {
  if (rolePath(role) !== expectedPath) throw new Error(`Unexpected role path for ${role}`);
}

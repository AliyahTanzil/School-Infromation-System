import { randomUUID } from 'node:crypto';

export function generateEmployeeNumber({ firstName, lastName }) {
  const initials =
    [firstName, lastName]
      .map((name) =>
        name
          .normalize('NFKD')
          .replace(/[^a-z]/gi, '')
          .charAt(0)
          .toUpperCase()
      )
      .join('') || 'EMP';
  return `T-${initials}-${randomUUID().replaceAll('-', '').toUpperCase()}`;
}

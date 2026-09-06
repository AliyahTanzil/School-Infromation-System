import { createHash, randomUUID } from 'node:crypto';

// Stable once persisted; fresh entropy distinguishes people with identical details.
export function generateRecordCode(kind, scope, details) {
  const normalized = details.map((value) =>
    value instanceof Date
      ? value.toISOString()
      : String(value ?? '')
          .trim()
          .normalize('NFKC')
          .toLowerCase()
  );
  const label =
    normalized[0]
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() || 'RECORD';
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([kind, scope, ...normalized]))
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
  return `${kind}-${label}-${fingerprint}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
}

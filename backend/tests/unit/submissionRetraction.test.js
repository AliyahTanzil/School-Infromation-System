import test from 'node:test';
import assert from 'node:assert/strict';

const db = { $on() {} };
globalThis.__prisma = db;
const { updateStatus } = await import('../../src/application/services/submissionService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const access = { roles: ['STUDENT'] };
const retract = () => updateStatus(scope, 'submission', 'actor', access, 'DRAFT');

function fixture({
  count = 1,
  failRead = false,
  member = true,
  missing = false,
  status = 'SUBMITTED',
  assignmentStatus = 'PUBLISHED',
} = {}) {
  const state = { status, submittedAt: new Date(), writes: 0, rolledBack: false };
  db.$transaction = async (callback, options) => {
    assert.deepEqual(options, { isolationLevel: 'Serializable' });
    const snapshot = { ...state };
    let reads = 0;
    const tx = {
      studentSubmission: {
        findFirst: async ({ where }) => {
          assert.deepEqual(where, { id: 'submission', ...scope, studentId: 'actor' });
          reads++;
          if (reads === 2 && failRead) throw new Error('Read failed');
          return missing
            ? null
            : {
                id: 'submission',
                status: state.status,
                submittedAt: state.submittedAt,
                assignmentId: 'assignment',
                assignment: { status: assignmentStatus },
              };
        },
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, {
            id: 'submission',
            ...scope,
            studentId: 'actor',
            assignmentId: 'assignment',
            status: 'SUBMITTED',
            assignment: { is: { ...scope, status: 'PUBLISHED' } },
          });
          assert.deepEqual(data, { status: 'DRAFT', submittedAt: null });
          if (count === 1) {
            Object.assign(state, data);
            state.writes++;
          }
          return { count };
        },
      },
      assignment: {
        findFirst: async ({ where, include }) => {
          assert.deepEqual(where, { id: 'assignment', ...scope, status: { not: 'ARCHIVED' } });
          assert.deepEqual(include.classroom.include.memberships.where, {
            userId: 'actor',
            status: 'ACTIVE',
          });
          return {
            classroom: { ownerId: 'other', memberships: member ? [{ role: 'STUDENT' }] : [] },
          };
        },
      },
    };
    try {
      return await callback(tx);
    } catch (error) {
      Object.assign(state, snapshot, { rolledBack: true });
      throw error;
    }
  };
  // All persistence must use the transaction client, not the global client.
  db.studentSubmission = { findFirst: () => assert.fail('Nontransactional read') };
  db.assignment = { findFirst: () => assert.fail('Nontransactional membership read') };
  return state;
}

test('retraction checks membership and claims scoped submitted work in one transaction', async () => {
  const state = fixture();
  const result = await retract();
  assert.equal(result.status, 'DRAFT');
  assert.equal(result.submittedAt, null);
  assert.equal(state.writes, 1);
  assert.equal(state.rolledBack, false);
});

test('a lost conditional claim returns conflict instead of success', async () => {
  const state = fixture({ count: 0 });
  await assert.rejects(
    retract(),
    (error) => error.statusCode === 409 && /Submission changed/.test(error.message)
  );
  assert.equal(state.status, 'SUBMITTED');
  assert.equal(state.writes, 0);
});

test('failure reading the updated submission rolls back the retraction', async () => {
  const state = fixture({ failRead: true });
  await assert.rejects(retract(), /Read failed/);
  assert.equal(state.status, 'SUBMITTED');
  assert.ok(state.submittedAt instanceof Date);
  assert.equal(state.writes, 0);
  assert.equal(state.rolledBack, true);
});

test('ownership, membership and lifecycle failures perform no retraction writes', async () => {
  for (const [options, message] of [
    [{ missing: true }, /Submission not found/],
    [{ member: false }, /not a member/],
    [{ status: 'DRAFT' }, /cannot move/],
    [{ assignmentStatus: 'CLOSED' }, /no longer accepts/],
  ]) {
    const state = fixture(options);
    await assert.rejects(retract(), message);
    assert.equal(state.writes, 0);
  }
});

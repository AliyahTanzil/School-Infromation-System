import assert from 'node:assert/strict';
import test from 'node:test';
const db = { $on() {} };
globalThis.__prisma = db;
const service = await import('../../src/application/services/timetableRoomService.js');
const scope = { tenantId: 'tenant', schoolId: 'school' };
const room = {
  id: 'room',
  ...scope,
  name: 'Science laboratory',
  code: 'SCI',
  kind: 'LABORATORY',
  capacity: 40,
  isActive: true,
  resources: ['Lab benches'],
};
function prepare() {
  const writes = [];
  db.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(db);
  };
  db.timetableRoom = {
    findFirst: async ({ where }) => {
      assert.equal(where.schoolId, scope.schoolId);
      assert.equal(where.tenantId, scope.tenantId);
      return room;
    },
    create: async ({ data }) => {
      writes.push(data);
      return data;
    },
    update: async ({ data }) => {
      writes.push(data);
      return data;
    },
    delete: async () => writes.push('delete'),
  };
  db.scheduleEntry = { findMany: async () => [], count: async () => 0 };
  db.class = { findFirst: async () => ({ capacity: 30 }) };
  return writes;
}
test('room CRUD validates data, preserves partial fields and prevents cross-school updates', async () => {
  const writes = prepare();
  await service.createTimetableRoom(room);
  assert.equal(writes[0].schoolId, scope.schoolId);
  await service.updateTimetableRoom({ ...scope, id: 'room', capacity: 50 });
  assert.deepEqual(writes[1].resources, ['Lab benches']);
  await assert.rejects(
    service.updateTimetableRoom({ ...scope, id: 'room', capacity: 0 }),
    /Invalid room/
  );
  db.timetableRoom.findFirst = async () => null;
  await assert.rejects(
    service.updateTimetableRoom({ ...scope, id: 'room', capacity: 50 }),
    /not found/
  );
});
test('rooms in use cannot be deleted, deactivated, downsized or converted from labs', async () => {
  const writes = prepare();
  db.scheduleEntry.count = async () => 1;
  await assert.rejects(service.removeTimetableRoom({ ...scope, id: 'room' }), /cannot be deleted/);
  db.scheduleEntry.findMany = async () => [{ kind: 'PRACTICAL', class: { capacity: 35 } }];
  for (const change of [{ isActive: false }, { capacity: 30 }, { kind: 'CLASSROOM' }]) {
    await assert.rejects(
      service.updateTimetableRoom({ ...scope, id: 'room', ...change }),
      /invalidate/
    );
  }
  assert.equal(writes.length, 0);
});
test('room assignment checks capacity, active state, lab type and overlapping multi-period lessons', async () => {
  prepare();
  const slots = [
    { id: 'one', weekday: 1, startTime: '08:00', endTime: '08:40' },
    { id: 'two', weekday: 1, startTime: '08:40', endTime: '09:20' },
  ];
  const entry = {
    roomId: 'room',
    classId: 'class',
    timeSlotId: 'one',
    duration: 2,
    kind: 'PRACTICAL',
  };
  await service.validateEntryRoom(db, scope, entry, slots, 'table');
  db.class.findFirst = async () => ({ capacity: 50 });
  await assert.rejects(service.validateEntryRoom(db, scope, entry, slots, 'table'), /capacity/);
  db.class.findFirst = async () => ({ capacity: 30 });
  db.scheduleEntry.findMany = async () => [{ timeSlotId: 'two', duration: 1 }];
  await assert.rejects(
    service.validateEntryRoom(db, scope, entry, slots, 'table'),
    /already booked/
  );
  db.timetableRoom.findFirst = async () => ({ ...room, isActive: false });
  await assert.rejects(service.validateEntryRoom(db, scope, entry, slots, 'table'), /inactive/);
  db.timetableRoom.findFirst = async () => ({ ...room, kind: 'CLASSROOM' });
  await assert.rejects(service.validateEntryRoom(db, scope, entry, slots, 'table'), /laboratory/);
});

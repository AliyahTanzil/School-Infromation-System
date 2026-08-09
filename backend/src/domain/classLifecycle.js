import { ClassStatus } from '@prisma/client';

const transitions = {
  [ClassStatus.PLANNED]: [ClassStatus.ACTIVE, ClassStatus.CANCELLED],
  [ClassStatus.ACTIVE]: [ClassStatus.ARCHIVED, ClassStatus.CANCELLED],
  [ClassStatus.CANCELLED]: [],
  [ClassStatus.ARCHIVED]: [],
};

export function assertClassTransition(from, to) {
  if (!transitions[from]?.includes(to)) {
    throw new Error(`Invalid class status transition: ${from} -> ${to}`);
  }
}

export function assertCapacity(capacity, enrolled) {
  if (!Number.isInteger(capacity) || capacity < 1)
    throw new Error('Capacity must be a positive integer');
  if (enrolled > capacity) throw new Error('Class capacity exceeded');
}

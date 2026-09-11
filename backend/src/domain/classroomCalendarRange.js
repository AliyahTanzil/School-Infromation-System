export const MAX_CALENDAR_RANGE_DAYS = 366;
export const CALENDAR_RANGE_ERROR =
  'Calendar dates must be valid, ordered and no more than 366 days apart';

export function validCalendarRange(start, end) {
  return (
    start instanceof Date &&
    end instanceof Date &&
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    end >= start &&
    end - start <= MAX_CALENDAR_RANGE_DAYS * 24 * 60 * 60 * 1000
  );
}

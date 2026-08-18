export type TimetableEntry = { id: string; subjectName?: string; className?: string; teacherName?: string; room?: string; dayOfWeek?: number; startsAt: string; endsAt: string; status?: string };
export type Timetable = { id: string; name?: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; entries: TimetableEntry[] };
export const timetableEndpoint = '/api/v1/timetables';

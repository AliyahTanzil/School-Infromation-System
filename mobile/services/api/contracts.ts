export type UserRole = 'administrator' | 'staff' | 'teacher' | 'student';

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; hasNext: boolean };
export type Person = { id: string; name: string; email: string; role: UserRole; status: 'active' | 'invited' | 'suspended' };
export type AcademicContext = { academicYear?: string; term?: string; schoolId?: string };
export type ListQuery = AcademicContext & { page?: number; pageSize?: number; search?: string; status?: string };

export const mobile4Endpoints = {
  users: '/api/v1/users',
  staff: '/api/v1/staff',
  students: '/api/v1/students',
} as const;

export function queryString(query: ListQuery = {}) {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== '');
  return entries.length ? `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)]))}` : '';
}

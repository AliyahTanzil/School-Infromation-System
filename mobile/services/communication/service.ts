import { apiRequest } from '../api/client';
import type {
  Notification,
  NotificationListResponse,
  NotificationPreferences,
  UnreadCountResponse,
} from './contracts';

export async function listNotifications(accessToken: string, params: { schoolId?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.schoolId) query.set('schoolId', params.schoolId);
  if (params.limit) query.set('limit', String(params.limit));
  const result = await apiRequest<NotificationListResponse>(`/api/v1/communication/notifications?${query}`, { accessToken });
  return result.data;
}

export async function getUnreadCount(accessToken: string, userId: string) {
  const result = await apiRequest<UnreadCountResponse>(`/api/v1/communication/notifications/unread-count?userId=${encodeURIComponent(userId)}`, { accessToken });
  return result.data.count;
}

export async function markNotificationRead(accessToken: string, notificationId: string, userId: string) {
  return apiRequest<{ data: unknown }>(`/api/v1/communication/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ userId }),
  });
}

export async function getNotificationPreferences(accessToken: string, userId: string, schoolId: string) {
  const result = await apiRequest<{ data: NotificationPreferences | null }>(`/communications/notification-preferences?userId=${encodeURIComponent(userId)}&schoolId=${encodeURIComponent(schoolId)}`, { accessToken });
  return result.data;
}

export async function saveNotificationPreferences(accessToken: string, preferences: NotificationPreferences) {
  return apiRequest<{ data: NotificationPreferences }>('/communications/notification-preferences', {
    method: 'PUT',
    accessToken,
    body: JSON.stringify(preferences),
  });
}

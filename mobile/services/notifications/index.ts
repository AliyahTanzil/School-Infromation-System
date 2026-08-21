import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiRequest } from '../api/client';
import { secureAuthStorage } from '../auth/secureStorage';
import type { Notification, NotificationPreferences } from '../communication/contracts';

export type NotificationRegistration = { deviceId: string; platform: 'ios' | 'android' | 'web'; token: string };

async function authOptions() {
  return { accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined };
}

export async function listNotifications(params: { schoolId?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.schoolId) query.set('schoolId', params.schoolId);
  if (params.status) query.set('status', params.status);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<Notification[]>(`/api/v1/communication/notifications${suffix}`, await authOptions());
}

export async function unreadNotificationCount(userId: string) {
  return apiRequest<{ count: number }>(`/api/v1/communication/notifications/unread-count?userId=${encodeURIComponent(userId)}`, await authOptions());
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return apiRequest<Notification>(`/api/v1/communication/notifications/${encodeURIComponent(notificationId)}/read`, {
    ...(await authOptions()), method: 'POST', body: JSON.stringify({ userId }),
  });
}

export async function getNotificationPreferences(userId: string, schoolId: string) {
  return apiRequest<NotificationPreferences>(`/api/v1/communication/notification-preferences?userId=${encodeURIComponent(userId)}&schoolId=${encodeURIComponent(schoolId)}`, await authOptions());
}

export interface NotificationService {
  register(registration: NotificationRegistration): Promise<void>;
}

export async function requestPushRegistration(deviceId: string): Promise<NotificationRegistration | null> {
  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return { deviceId, platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web', token };
}

export const notifications: NotificationService = {
  register: async (registration) => {
    // The backend needs a device-token registration route before this can be persisted remotely.
    if (!registration.token.trim()) throw new Error('Push token is required');
  },
};

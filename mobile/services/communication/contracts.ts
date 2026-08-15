export type NotificationStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationRecipient = {
  notificationId: string;
  userId: string;
  readAt?: string | null;
};

export type Notification = {
  id: string;
  tenantId: string;
  schoolId: string;
  title: string;
  body: string;
  type: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string | null;
  recipients?: NotificationRecipient[];
};

export type NotificationListResponse = { data: Notification[] };
export type UnreadCountResponse = { data: { count: number } };
export type NotificationPreferences = {
  userId: string;
  schoolId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  inApp: boolean;
  quietHours: { start: string; end: string };
};

export function isSafeNotificationPath(path?: string | null) {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}

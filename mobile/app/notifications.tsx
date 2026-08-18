import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { NotificationInbox } from '../components/communication/NotificationInbox';
import { Screen } from '../components/ui/Screen';
import type { Notification } from '../services/communication/contracts';

const demoNotifications: Notification[] = [
  { id: 'notice-1', tenantId: 'tenant-demo', schoolId: 'school-demo', title: 'Welcome to SAIS Mobile', body: 'Your notification inbox is ready. Live delivery will use the configured communication API.', type: 'GENERAL', priority: 'NORMAL', status: 'SENT', createdAt: new Date().toISOString(), readAt: null },
];

export default function NotificationsScreen() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const notifications = useMemo(() => demoNotifications.map((item) => ({ ...item, readAt: readIds.includes(item.id) ? new Date().toISOString() : item.readAt })), [readIds]);
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  return <Screen title="Notifications"><NotificationInbox notifications={notifications} unreadCount={unreadCount} onRead={(item) => setReadIds((ids) => ids.includes(item.id) ? ids : [...ids, item.id])} /><Text accessible accessibilityLiveRegion="polite">{unreadCount} unread</Text></Screen>;
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { NotificationInbox } from '../components/communication/NotificationInbox';
import { Screen } from '../components/ui/Screen';
import { listNotifications, markNotificationRead } from '../services/notifications';
import { useAuth } from '../providers/AuthProvider';
import type { Notification } from '../services/communication/contracts';

export default function NotificationsScreen() {
  const { state } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { listNotifications().then(setItems).catch((cause) => setMessage(cause instanceof Error ? cause.message : 'Unable to load notifications.')); }, []);
  if (message) return <Screen title="Notifications"><Text>{message}</Text></Screen>;
  if (!items) return <Screen title="Notifications"><ActivityIndicator /></Screen>;
  const unreadCount = items.filter((item) => !item.readAt).length;
  return <Screen title="Notifications"><NotificationInbox notifications={items} unreadCount={unreadCount} onRead={async (item) => { if (state.status === 'authenticated') { await markNotificationRead(item.id, state.session.userId); setItems((current) => current?.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry) ?? []); } }} /><Text accessible accessibilityLiveRegion="polite">{unreadCount} unread</Text></Screen>;
}

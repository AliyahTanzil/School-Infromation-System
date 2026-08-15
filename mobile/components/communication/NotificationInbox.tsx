import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { Notification } from '../../services/communication/contracts';

type Props = { notifications: Notification[]; unreadCount: number; onRead: (notification: Notification) => void };

export function NotificationInbox({ notifications, unreadCount, onRead }: Props) {
  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.heading}>Inbox</Text>
    <Text style={styles.meta}>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</Text>
    {notifications.length === 0 ? <Text style={styles.empty}>No notifications yet.</Text> : notifications.map((item) => {
      const unread = !item.readAt;
      return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title}${unread ? ', unread' : ''}`} onPress={() => onRead(item)} style={[styles.item, unread && styles.unread]}>
        <View style={styles.itemHeader}><Text style={styles.title}>{item.title}</Text><Text style={styles.priority}>{item.priority}</Text></View>
        <Text style={styles.body}>{item.body}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, paddingVertical: spacing.lg },
  item: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  unread: { borderColor: colors.blue, borderWidth: 2 },
  itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '700' },
  priority: { color: colors.muted, fontSize: 11, textTransform: 'uppercase' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});

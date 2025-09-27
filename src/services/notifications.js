import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Nhắc uống thuốc',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return status === 'granted';
}

export async function scheduleReminder({ title, body, date }) {
  // date: Date object (local time)
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: date,
  });
}

export async function cancelReminder(id) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function cancelAllReminders() {
  const ids = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(ids.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export function buildDateFromTime(date, time) {
  // date: dayjs or Date of the selected day, time: 'HH:mm'
  const d = new Date(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

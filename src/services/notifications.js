import { Platform } from 'react-native';

// Import notifications with error handling
let Notifications = null;
try {
  Notifications = require('expo-notifications');
  
  // Only set handler if notifications are available
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  // Silently handle if notifications not available
}

export async function requestPermissions() {
  if (!Notifications) return false;
  
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Nhắc uống thuốc',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleReminder({ title, body, date }) {
  if (!Notifications) return { identifier: 'mock-id' };
  
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: date,
    });
  } catch {
    return { identifier: 'error-id' };
  }
}

export async function cancelReminder(id) {
  if (!Notifications || !id) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function cancelAllReminders() {
  if (!Notifications) return;
  
  try {
    const ids = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(ids.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {}
}

export function buildDateFromTime(date, time) {
  // date: dayjs or Date of the selected day, time: 'HH:mm'
  const d = new Date(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

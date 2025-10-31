import { Platform } from 'react-native';
import Constants from 'expo-constants';
import MockNotifications from './mockNotifications';

// Kiểm tra SDK version và appOwnership để xác định xem có đang chạy trong Expo Go SDK 53+ hay không
const isExpoGoWithSDK53Plus = () => {
  try {
    const usingExpoGo = Constants.appOwnership === 'expo';
    const sdkVersion = Constants.expoVersion || '0';
    const sdkMajorVersion = parseInt(sdkVersion.split('.')[0]) || 0;
    return usingExpoGo && sdkMajorVersion >= 53;
  } catch {
    return false;
  }
};

// Sử dụng cách import an toàn hơn để tránh lỗi
let Notifications = null;
try {
  // Nếu đang chạy trong Expo Go SDK 53+, sử dụng MockNotifications
  if (isExpoGoWithSDK53Plus()) {
    console.log("Đang chạy trong Expo Go SDK 53+, sử dụng MockNotifications");
    Notifications = MockNotifications;
    // Khởi tạo mock notifications
    MockNotifications.init();
  } else {
    // Kiểm tra trước khi import để tránh lỗi
    try {
      const expo = require('expo');
      if (expo.Notifications) {
        Notifications = expo.Notifications;
      } else {
        const expoNotifications = require('expo-notifications');
        Notifications = expoNotifications;
      }
    } catch {
      const expoNotifications = require('expo-notifications');
      Notifications = expoNotifications;
    }
  }
} catch (err) {
  console.error("Không thể import expo-notifications:", err);
  // Fallback sang mock notifications
  console.log("Fallback sang MockNotifications");
  Notifications = MockNotifications;
  MockNotifications.init();
}

// Cấu hình xử lý thông báo nếu notifications khả dụng
if (Notifications && !isExpoGoWithSDK53Plus()) {
  try {
    // Chỉ thiết lập notification handler nếu đó là phương thức hợp lệ
    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } else {
      console.warn("Notifications.setNotificationHandler không phải là một hàm");
    }
  } catch (err) {
    console.error("Lỗi khi thiết lập notification handler:", err);
  }
}

// Kiểm tra xem local notifications có hoạt động không
export async function checkNotificationAvailability() {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return {
      available: false,
      permissionGranted: false,
      canAskForPermission: false,
      error: "expo-notifications không khả dụng",
    };
  }
  
  try {
    // Trong Expo Go với SDK 53+, push notifications không khả dụng,
    // nhưng chúng ta cần kiểm tra xem local notifications có hoạt động không
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    return {
      available: true,
      permissionGranted: existingStatus === 'granted',
      canAskForPermission: existingStatus !== 'denied',
    };
  } catch (error) {
    console.error('Error checking notification availability:', error);
    return {
      available: false,
      permissionGranted: false,
      canAskForPermission: false,
      error: error.message,
    };
  }
}

// Yêu cầu quyền gửi thông báo
export async function requestNotificationPermissions() {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return { granted: false, error: "expo-notifications không khả dụng" };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    // Nếu đã có quyền, không cần yêu cầu lại
    if (existingStatus === 'granted') {
      return { granted: true };
    }
    
    // Nếu đã từ chối và không thể yêu cầu lại
    if (existingStatus === 'denied') {
      return { granted: false, canAskAgain: false };
    }
    
    // Yêu cầu quyền
    const { status } = await Notifications.requestPermissionsAsync();
    
    try {
      // Tạo kênh thông báo cho Android
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        // Sử dụng constant number thay vì enum để tránh lỗi
        // 4 = HIGH importance trong Android
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Nhắc uống thuốc',
          description: 'Thông báo nhắc uống thuốc đúng giờ',
          importance: 4, // HIGH importance
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }
    } catch (channelError) {
      console.error('Lỗi khi tạo kênh thông báo:', channelError);
      // Tiếp tục ngay cả khi có lỗi tạo kênh
    }
    
    return { granted: status === 'granted', canAskAgain: status !== 'denied' };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { granted: false, error: error.message };
  }
}

// Lập lịch thông báo cục bộ
export async function scheduleLocalNotification({ title, body, data = {}, trigger }) {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return { success: false, error: "expo-notifications không khả dụng" };
  }

  try {
    // Đảm bảo đã có quyền gửi thông báo
    const { granted } = await requestNotificationPermissions();
    if (!granted) {
      console.log('Cannot schedule notification: permission not granted');
      return { success: false, error: 'permission_denied' };
    }
    
    // Lập lịch thông báo
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: 'high', // Dùng string thay vì enum
      },
      trigger,
    });
    
    console.log(`Đã lập lịch thông báo "${title}" với ID: ${notificationId}`);
    return { success: true, id: notificationId };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error: error.message };
  }
}

// Hủy một thông báo đã lập lịch
export async function cancelScheduledNotification(notificationId) {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return { success: false, error: "expo-notifications không khả dụng" };
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return { success: true };
  } catch (error) {
    console.error('Error canceling notification:', error);
    return { success: false, error: error.message };
  }
}

// Hủy tất cả thông báo đã lập lịch
export async function cancelAllScheduledNotifications() {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return { success: false, error: "expo-notifications không khả dụng" };
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Đã hủy tất cả thông báo đã lập lịch");
    return { success: true };
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return { success: false, error: error.message };
  }
}

// Lấy danh sách tất cả thông báo đã lập lịch
export async function getAllScheduledNotifications() {
  if (!Notifications) {
    console.log("expo-notifications không khả dụng");
    return { success: false, error: "expo-notifications không khả dụng", notifications: [] };
  }

  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Có ${notifications.length} thông báo đã được lập lịch`);
    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
}

// Tạo date object từ ngày và thời gian
export function buildDateFromTime(date, time) {
  const d = new Date(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}
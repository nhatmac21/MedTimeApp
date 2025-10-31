import { Alert } from 'react-native';
import { getData, storeData } from './storage';

// Khóa để lưu trữ "mock notifications"
const MOCK_NOTIFICATIONS_KEY = 'MOCK_NOTIFICATIONS';

/**
 * MockNotifications: Triển khai giả cho expo-notifications
 * Khi expo-notifications không hoạt động trong Expo Go với SDK 53+
 * Lớp này tạo một hệ thống thông báo đơn giản bằng cách kiểm tra định kỳ
 */
class MockNotificationsManager {
  constructor() {
    this.initialized = false;
    this.permissions = { status: 'undetermined', canAskAgain: true };
    this.scheduledNotifications = [];
    this.checkIntervalId = null;
  }

  // Khởi tạo mock notifications
  async init() {
    if (this.initialized) return;
    
    try {
      // Tải thông báo đã lưu
      const storedNotifications = await getData(MOCK_NOTIFICATIONS_KEY);
      if (storedNotifications) {
        this.scheduledNotifications = storedNotifications;
        
        // Lọc bỏ các thông báo đã hết hạn
        const now = Date.now();
        this.scheduledNotifications = this.scheduledNotifications.filter(
          notification => new Date(notification.trigger).getTime() > now
        );
        
        // Cập nhật lại storage sau khi lọc
        await this._saveNotifications();
      }
      
      this.initialized = true;
      
      // Bắt đầu kiểm tra thông báo định kỳ
      this._startChecking();
    } catch (error) {
      console.error('Lỗi khởi tạo mock notifications:', error);
    }
  }
  
  // Lưu danh sách thông báo vào storage
  async _saveNotifications() {
    try {
      await storeData(MOCK_NOTIFICATIONS_KEY, this.scheduledNotifications);
    } catch (error) {
      console.error('Lỗi khi lưu danh sách thông báo:', error);
    }
  }
  
  // Bắt đầu kiểm tra thông báo định kỳ
  _startChecking() {
    // Xóa interval cũ nếu có
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    
    // Kiểm tra mỗi 30 giây
    this.checkIntervalId = setInterval(() => {
      this._checkDueNotifications();
    }, 30000);
    
    // Kiểm tra ngay lập tức
    this._checkDueNotifications();
  }
  
  // Dừng kiểm tra thông báo
  _stopChecking() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }
  
  // Kiểm tra các thông báo đến hạn
  async _checkDueNotifications() {
    if (!this.scheduledNotifications.length) return;
    
    const now = Date.now();
    const dueNotifications = this.scheduledNotifications.filter(
      notification => new Date(notification.trigger).getTime() <= now
    );
    
    if (dueNotifications.length > 0) {
      // Xóa các thông báo đến hạn khỏi danh sách
      this.scheduledNotifications = this.scheduledNotifications.filter(
        notification => new Date(notification.trigger).getTime() > now
      );
      
      // Lưu lại danh sách đã cập nhật
      await this._saveNotifications();
      
      // Hiển thị thông báo trên màn hình
      dueNotifications.forEach(notification => {
        this._showNotificationAlert(notification);
      });
    }
  }
  
  // Hiển thị thông báo bằng Alert
  _showNotificationAlert(notification) {
    Alert.alert(
      notification.content.title,
      notification.content.body,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }
  
  // API giống expo-notifications
  async getPermissionsAsync() {
    return this.permissions;
  }
  
  async requestPermissionsAsync() {
    if (this.permissions.status !== 'granted') {
      Alert.alert(
        'Thông báo cục bộ',
        'Ứng dụng sẽ sử dụng thông báo cục bộ để nhắc nhở uống thuốc khi ứng dụng đang mở.',
        [{ text: 'Đồng ý', onPress: () => { this.permissions.status = 'granted'; } }],
        { cancelable: false }
      );
    }
    return this.permissions;
  }
  
  async scheduleNotificationAsync(notification) {
    const id = Math.random().toString(36).substring(2, 15);
    
    this.scheduledNotifications.push({
      id,
      content: notification.content,
      trigger: notification.trigger
    });
    
    await this._saveNotifications();
    return id;
  }
  
  async cancelScheduledNotificationAsync(id) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.id !== id
    );
    await this._saveNotifications();
  }
  
  async cancelAllScheduledNotificationsAsync() {
    this.scheduledNotifications = [];
    await this._saveNotifications();
  }
  
  async getAllScheduledNotificationsAsync() {
    return this.scheduledNotifications;
  }
}

// Export một instance để sử dụng trong ứng dụng
const MockNotifications = new MockNotificationsManager();

export default MockNotifications;
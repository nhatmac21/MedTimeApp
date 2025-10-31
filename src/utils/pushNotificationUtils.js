import Constants from 'expo-constants';

/**
 * Kiểm tra xem push notifications có khả dụng không
 * Từ SDK 53, push notifications không khả dụng trong Expo Go
 */
export const arePushNotificationsAvailable = () => {
  try {
    const usingExpoGo = Constants.appOwnership === 'expo';
    const sdkVersion = Constants.expoVersion || '0';
    const sdkMajorVersion = parseInt(sdkVersion.split('.')[0]) || 0;
    
    return !usingExpoGo || sdkMajorVersion < 53;
  } catch (error) {
    console.log('Error checking push notification availability:', error);
    return false;
  }
};

/**
 * Hiển thị thông báo cho người dùng về việc push notifications 
 * không khả dụng trong Expo Go với SDK 53+
 */
export const showPushNotificationWarning = () => {
  if (!arePushNotificationsAvailable()) {
    console.log(
      'Push notifications are not available in Expo Go with SDK 53+.\n' +
      'To test push notifications, create a development build:\n' +
      'https://docs.expo.dev/develop/development-builds/introduction/'
    );
    return true;
  }
  return false;
};

/**
 * Tạo mock API cho push notifications khi không khả dụng
 */
export const createMockPushNotificationAPI = () => ({
  getExpoPushTokenAsync: async () => ({ data: 'EXPO-PUSH-TOKEN-NOT-AVAILABLE' }),
  getPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }),
  requestPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }),
});
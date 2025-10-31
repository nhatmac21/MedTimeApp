import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { checkNotificationAvailability, requestNotificationPermissions } from '../services/localNotifications';
import { Colors } from '../theme/colors';
import Constants from 'expo-constants';

export default function NotificationsSetupCheck() {
  const [notificationsState, setNotificationsState] = useState({
    checked: false,
    available: false,
    permissionGranted: false,
    canAskForPermission: false,
  });
  
  // Kiểm tra xem có đang chạy trong Expo Go SDK 53+ không
  const isExpoGoSDK53Plus = () => {
    try {
      const usingExpoGo = Constants.appOwnership === 'expo';
      const sdkVersion = Constants.expoVersion || '0';
      const sdkMajorVersion = parseInt(sdkVersion.split('.')[0]) || 0;
      return usingExpoGo && sdkMajorVersion >= 53;
    } catch {
      return false;
    }
  };

  // Kiểm tra tình trạng thông báo khi component được load
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  // Hàm kiểm tra trạng thái thông báo
  const checkNotificationStatus = async () => {
    const result = await checkNotificationAvailability();
    setNotificationsState({
      checked: true,
      available: result.available,
      permissionGranted: result.permissionGranted,
      canAskForPermission: result.canAskForPermission,
    });
  };

  // Hàm yêu cầu quyền thông báo
  const requestPermission = async () => {
    const result = await requestNotificationPermissions();
    
    if (result.granted) {
      setNotificationsState(prev => ({
        ...prev,
        permissionGranted: true,
      }));
      Alert.alert('Thành công', 'Đã bật thông báo nhắc uống thuốc');
    } else if (!result.canAskAgain) {
      Alert.alert(
        'Cần bật thông báo',
        'Hãy vào Cài đặt của thiết bị > Ứng dụng > MedTime > Thông báo để bật thông báo',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Lỗi', 'Không thể bật thông báo. Vui lòng thử lại sau.');
    }
  };

  // Nếu đang chạy trong Expo Go SDK 53+, hiển thị thông báo về việc đang sử dụng MockNotifications
  if (isExpoGoSDK53Plus() && Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ℹ️ Đang dùng thông báo cục bộ</Text>
        <Text style={styles.description}>
          Ứng dụng đang sử dụng chế độ thông báo cục bộ vì Expo Go SDK 53+ không hỗ trợ thông báo đẩy.
          Để nhận thông báo khi ứng dụng không mở, hãy tạo development build.
        </Text>
      </View>
    );
  }

  // Nếu chưa kiểm tra xong hoặc thông báo đã được bật, không hiển thị gì
  if (!notificationsState.checked || 
      (notificationsState.available && notificationsState.permissionGranted)) {
    return null;
  }

  // Nếu thông báo không khả dụng hoặc chưa được bật quyền
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ Thông báo chưa được bật</Text>
      <Text style={styles.description}>
        Bạn cần bật thông báo để nhận nhắc nhở uống thuốc đúng giờ
      </Text>
      {notificationsState.canAskForPermission ? (
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Bật thông báo</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.hint}>
          Hãy vào Cài đặt thiết bị để bật thông báo cho ứng dụng MedTime
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.warningBackground,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warningText,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.warningText,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  hint: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.warningText,
  },
});
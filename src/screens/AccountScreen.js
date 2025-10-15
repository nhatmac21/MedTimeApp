import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getUserInfo, updateUserInfo } from '../services/auth';

export default function AccountScreen({ visible, onClose }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editableData, setEditableData] = useState({
    fullname: '',
    email: '',
    phonenumber: '',
    dateofbirth: '',
    gender: '',
    timezone: ''
  });

  useEffect(() => {
    if (visible) {
      loadUserInfo();
    }
  }, [visible]);

  const loadUserInfo = async () => {
    setLoading(true);
    try {
      const result = await getUserInfo();
      if (result.success) {
        setUserInfo(result.data);
        setEditableData({
          fullname: result.data.fullname || '',
          email: result.data.email || '',
          phonenumber: result.data.phonenumber || '',
          dateofbirth: result.data.dateofbirth || '',
          gender: result.data.gender || '',
          timezone: result.data.timezone || ''
        });
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tải thông tin người dùng');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải thông tin');
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format for input
  };

  const formatGenderForDisplay = (gender) => {
    if (!gender || gender === 'string') return '';
    return gender;
  };

  const handleSave = async () => {
    if (!userInfo?.userid) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserInfo(userInfo.userid, editableData);
      if (result.success) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công', [
          { text: 'OK', onPress: () => onClose() }
        ]);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật thông tin');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật thông tin');
      console.error('Error updating user info:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const userFields = [
    {
      label: 'Tên',
      field: 'fullname',
      value: editableData.fullname,
      placeholder: 'Nhập tên đầy đủ',
      keyboardType: 'default'
    },
    {
      label: 'Gmail/E-mail',
      field: 'email',
      value: editableData.email,
      placeholder: 'Nhập email',
      keyboardType: 'email-address'
    },
    {
      label: 'Số điện thoại',
      field: 'phonenumber',
      value: editableData.phonenumber,
      placeholder: 'Nhập số điện thoại',
      keyboardType: 'phone-pad'
    },
    {
      label: 'Ngày sinh',
      field: 'dateofbirth',
      value: formatDateForDisplay(editableData.dateofbirth),
      placeholder: 'YYYY-MM-DD',
      keyboardType: 'default'
    },
    {
      label: 'Giới tính',
      field: 'gender',
      value: formatGenderForDisplay(editableData.gender),
      placeholder: 'Nam/Nữ',
      keyboardType: 'default'
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tài khoản</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.contentPadding}>
              
              {/* User Fields */}
              {userFields.map((field, index) => (
                <View key={index} style={styles.fieldCard}>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={field.value}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={field.keyboardType}
                      onChangeText={(value) => updateField(field.field, value)}
                    />
                  </View>
                </View>
              ))}

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentPadding: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textMuted,
  },
  fieldCard: {
    backgroundColor: Colors.white,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    maxWidth: '60%',
    textAlign: 'right',
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primaryDark,
    maxWidth: '60%',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
    paddingBottom: 5,
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { logoutUser, getCurrentUser } from '../services/auth';
import AccountScreen from './AccountScreen';

export default function SettingsScreen({ visible, onClose, onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [showAccountScreen, setShowAccountScreen] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUserInfo();
    }
  }, [visible]);

  const loadUserInfo = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserInfo(user);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              onClose();
              onLogout();
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            }
          }
        }
      ]
    );
  };

  const settingsItems = [
    {
      
      items: [
        {
          id: 'account',
          title: 'Tài khoản',
          icon: 'shield-checkmark-outline',
          onPress: () => setShowAccountScreen(true)
        }
      ]
    },
    {
    
      items: [
        {
          id: 'reports',
          title: 'Báo cáo',
          icon: 'document-text-outline',
          onPress: () => console.log('Báo cáo')
        }
      ]
    },
    {
      section: 'Chung',
      items: [
        {
          id: 'general-settings',
          title: 'Cài đặt chung',
          icon: 'settings-outline',
          onPress: () => console.log('Cài đặt chung')
        },
        {
          id: 'help-center',
          title: 'Trung tâm trợ giúp',
          icon: 'help-circle-outline',
          onPress: () => console.log('Trung tâm trợ giúp')
        }
      ]
    }
  ];

  return (
    <>
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
            <View style={styles.headerLeft} />
            <Text style={styles.headerTitle}>Cài đặt</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {/* User Info */}
            {userInfo && (
              <View style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={32} color={Colors.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userInfo.fullname || userInfo.username}</Text>
                  <Text style={styles.userEmail}>{userInfo.email}</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={[styles.premiumText, { color: userInfo.isPremium ? Colors.accent : Colors.textMuted }]}>
                      {userInfo.isPremium ? 'Premium' : 'Miễn phí'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Settings Sections */}
            {settingsItems.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.section}</Text>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.settingItem}
                    onPress={item.onPress}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.itemIcon}>
                        <Ionicons name={item.icon} size={24} color={Colors.primary} />
                      </View>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Logout Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.settingItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon, styles.logoutIcon]}>
                    <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                  </View>
                  <Text style={[styles.itemTitle, styles.logoutText]}>Đăng xuất</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </View>
    </Modal>

      <AccountScreen
        visible={showAccountScreen}
        onClose={() => setShowAccountScreen(false)}
      />
    </>
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
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentPadding: {
    padding: 20,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  settingItem: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: Colors.errorLight,
  },
  logoutIcon: {
    backgroundColor: Colors.errorLight,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
  },
});
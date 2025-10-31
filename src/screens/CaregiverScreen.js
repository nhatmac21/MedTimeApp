import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { logoutUser, getCurrentUser, isUserPremium } from '../services/auth';

export default function CaregiverScreen({ onLogout, navigation }) {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadUserData();
    
    // Listen for navigation focus to refresh user data
    const unsubscribe = navigation?.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      const premiumStatus = await isUserPremium();
      setUser(currentUser);
      setIsPremium(premiumStatus);
    } catch (error) {
      console.log('Error loading user data:', error);
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
            const success = await logoutUser();
            if (success && onLogout) {
              onLogout();
            }
          }
        }
      ]
    );
  };

  const handlePremiumUpgrade = () => {
    if (navigation) {
      navigation.navigate('Premium');
    } else {
      Alert.alert('Thông báo', 'Chức năng nâng cấp Premium đang được phát triển');
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header với gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quan sát từ xa</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          
          {/* User Info Card */}
          {user && (
            <View style={styles.userInfoCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.fullname || user.username || 'Người dùng'}
                </Text>
                <View style={styles.premiumStatus}>
                  {isPremium ? (
                    <>
                      <Ionicons name="diamond" size={16} color={Colors.accent} />
                      <Text style={styles.premiumText}>Premium</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="person" size={16} color={Colors.textMuted} />
                      <Text style={styles.freeText}>Miễn phí</Text>
                    </>
                  )}
                </View>
              </View>
              {!isPremium && (
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={handlePremiumUpgrade}
                >
                  <Ionicons name="diamond" size={18} color={Colors.white} />
                  <Text style={styles.upgradeButtonText}>Nâng cấp</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Premium Features Card (chỉ hiện khi chưa premium) */}
          {!isPremium && (
            <TouchableOpacity 
              style={styles.premiumFeaturesCard}
              onPress={handlePremiumUpgrade}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.accent }]}>
                  <Ionicons name="diamond" size={28} color={Colors.white} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Nâng cấp Premium</Text>
                  <Text style={styles.cardSubtitle}>Mở khóa tất cả tính năng</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          
          {/* Giám hộ của bạn Card */}
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="eye-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Giám hộ của bạn</Text>
                <Text style={styles.cardSubtitle}>Người giám sát bạn</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Giám sát Card */}
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="people-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Giám sát</Text>
                <Text style={styles.cardSubtitle}>Người bạn giám sát</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Lịch sử thanh toán (chỉ hiện khi đã premium) */}
          {isPremium && (
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="receipt-outline" size={28} color={Colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Lịch sử thanh toán</Text>
                  <Text style={styles.cardSubtitle}>Xem giao dịch đã thực hiện</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabContent}>
          <Ionicons name="people-outline" size={20} color={Colors.white} />
          <Text style={styles.fabText}>Giám hộ</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 100, // Space for FAB
  },
  // User Info Card
  userInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  premiumStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent,
    marginLeft: 4,
  },
  freeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  upgradeButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Premium Features Card
  premiumFeaturesCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accent,
    elevation: 2,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fabText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { logoutUser, getCurrentUser } from '../services/auth';
import SettingsScreen from './SettingsScreen';

export default function CaregiverScreen({ onLogout }) {
  const [currentView, setCurrentView] = useState('tab'); // 'tab', 'monitoring', 'enterCode'
  const [searchCode, setSearchCode] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

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
            const success = await logoutUser();
            if (success && onLogout) {
              onLogout();
            }
          }
        }
      ]
    );
  };
  const renderTabScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header với gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quan sát từ xa</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          
          {/* Mã giám sát của bạn */}
          {userInfo?.uniquecode && (
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeTitle}>Mã giám sát của bạn</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(userInfo.uniquecode);
                    Alert.alert('Thành công', 'Đã sao chép mã giám sát');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{userInfo.uniquecode}</Text>
              </View>
              <Text style={styles.codeDescription}>
                Chia sẻ mã này cho người thân để họ có thể giám sát việc uống thuốc của bạn
              </Text>
            </View>
          )}
          
          {/* Giám hộ của bạn Card */}
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="people-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Giám hộ của bạn</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Giám sát Card */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => setCurrentView('monitoring')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Giám sát</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="eye-outline" size={28} color={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>

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

  const renderMonitoringScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentView('tab')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giám sát</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Guardian Cards */}
        <View style={styles.guardianList}>
          <TouchableOpacity style={styles.guardianCard}>
            <View style={styles.guardianInfo}>
              <Text style={styles.guardianName}>Trần Văn C</Text>
              <Text style={styles.guardianRole}>Bố</Text>
            </View>
            <View style={styles.guardianAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guardianCard}>
            <View style={styles.guardianInfo}>
              <Text style={styles.guardianName}>Nguyễn Thị D</Text>
              <Text style={styles.guardianRole}>Mẹ</Text>
            </View>
            <View style={styles.guardianAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Add Button */}
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setCurrentView('enterCode')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabContent}>
          <Ionicons name="people" size={20} color={Colors.white} />
          <Text style={styles.fabText}>Giám hộ</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderEnterCodeScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentView('monitoring')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nhập code</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập mã code..."
              placeholderTextColor={Colors.textMuted}
              value={searchCode}
              onChangeText={setSearchCode}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabContent}>
          <Ionicons name="people" size={20} color={Colors.white} />
          <Text style={styles.fabText}>Giám hộ</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {currentView === 'tab' && renderTabScreen()}
      {currentView === 'monitoring' && renderMonitoringScreen()}
      {currentView === 'enterCode' && renderEnterCodeScreen()}
      
      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={onLogout}
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  settingsButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 100, // Space for FAB
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  codeCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  codeContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  codeDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  guardianList: {
    marginTop: 20,
  },
  guardianCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  guardianInfo: {
    flex: 1,
  },
  guardianName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  guardianRole: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  guardianAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 20,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    marginTop: 30,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 15,
  },
  searchButton: {
    padding: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fabText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getPremiumPlans, formatCurrency, canUpgradeToPremium } from '../services/payment';
import { getCurrentUser, isUserPremium } from '../services/auth';

export default function PremiumScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [canUpgrade, setCanUpgrade] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user info
      const currentUser = await getCurrentUser();
      const premiumStatus = await isUserPremium();
      setUser(currentUser);
      setIsPremium(premiumStatus);

      // Check if user can upgrade
      const upgradeCheck = await canUpgradeToPremium();
      if (upgradeCheck.success) {
        setCanUpgrade(upgradeCheck.canUpgrade);
      }

      // Load premium plans
      const plansResult = await getPremiumPlans();
      if (plansResult.success) {
        const activePlans = plansResult.plans.filter(plan => plan.isActive);
        
        if (activePlans.length === 0) {
          Alert.alert(
            'Thông báo', 
            'Hiện tại chưa có gói Premium nào. Vui lòng quay lại sau.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        setPlans(activePlans);
        
        // Auto-select the first active plan
        if (activePlans.length > 0) {
          setSelectedPlan(activePlans[0]);
        }
      } else {
        Alert.alert(
          'Lỗi kết nối', 
          'Không thể tải danh sách gói Premium. Vui lòng kiểm tra kết nối mạng và thử lại.',
          [
            { text: 'Thử lại', onPress: () => loadData() },
            { text: 'Quay lại', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading premium data:', error);
      Alert.alert(
        'Có lỗi xảy ra', 
        'Không thể tải dữ liệu Premium. Vui lòng thử lại sau.',
        [
          { text: 'Thử lại', onPress: () => loadData() },
          { text: 'Quay lại', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePurchase = () => {
    if (!selectedPlan) {
      Alert.alert('Thông báo', 'Vui lòng chọn gói Premium');
      return;
    }

    if (!canUpgrade) {
      Alert.alert('Thông báo', 'Bạn đã có gói Premium đang hoạt động');
      return;
    }

    // Navigate to payment screen
    navigation.navigate('Payment', { 
      plan: selectedPlan,
      returnScreen: 'Premium' 
    });
  };

  const getPlanTypeColor = (type) => {
    const colors = {
      'MONTHLY': Colors.primary,
      'YEARLY': Colors.accent,
      'LIFETIME': '#9C27B0',
    };
    return colors[type] || Colors.primary;
  };

  const getPlanTypeIcon = (type) => {
    const icons = {
      'MONTHLY': 'calendar-outline',
      'YEARLY': 'trophy-outline',
      'LIFETIME': 'diamond-outline',
    };
    return icons[type] || 'star-outline';
  };

  const formatDuration = (durationDays) => {
    if (durationDays === 30 || durationDays === 31) return '1 tháng';
    if (durationDays === 365 || durationDays === 366) return '1 năm';
    if (durationDays === 999999) return 'Vĩnh viễn';
    return `${durationDays} ngày`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải gói Premium...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nâng cấp Premium</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isPremium && (
          <View style={styles.currentPremiumBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.currentPremiumText}>
              Bạn đang sử dụng gói Premium
            </Text>
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Tính năng Premium</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="infinite" size={24} color={Colors.success} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Không giới hạn thuốc</Text>
                <Text style={styles.benefitDescription}>
                  Thêm bao nhiêu loại thuốc tùy ý, không bị giới hạn 2 loại như tài khoản miễn phí
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="sync" size={24} color={Colors.success} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Đồng bộ đa thiết bị</Text>
                <Text style={styles.benefitDescription}>
                  Dữ liệu được lưu trên cloud, truy cập từ nhiều thiết bị khác nhau
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="bar-chart" size={24} color={Colors.success} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Báo cáo chi tiết</Text>
                <Text style={styles.benefitDescription}>
                  Thống kê tuân thủ uống thuốc, xuất báo cáo gửi bác sĩ
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="people" size={24} color={Colors.success} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Giám sát từ xa</Text>
                <Text style={styles.benefitDescription}>
                  Chia sẻ thông tin với người thân để theo dõi việc uống thuốc
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="headset" size={24} color={Colors.success} />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Hỗ trợ ưu tiên</Text>
                <Text style={styles.benefitDescription}>
                  Nhận hỗ trợ kỹ thuật nhanh chóng qua hotline và email
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Chọn gói phù hợp</Text>
          
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.selectedPlanCard,
              ]}
              onPress={() => handlePlanSelect(plan)}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={[styles.planTypeIcon, { backgroundColor: getPlanTypeColor(plan.type) }]}>
                    <Ionicons 
                      name={getPlanTypeIcon(plan.type)} 
                      size={24} 
                      color={Colors.white} 
                    />
                  </View>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>{formatDuration(plan.durationDays)}</Text>
                  </View>
                </View>
                
                {selectedPlan?.id === plan.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                )}
              </View>

              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.priceContainer}>
                {plan.discountPercent > 0 && (
                  <Text style={styles.originalPrice}>
                    {formatCurrency(plan.price)}
                  </Text>
                )}
                <Text style={styles.finalPrice}>
                  {formatCurrency(plan.finalPrice)}
                </Text>
                {plan.discountPercent > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      -{plan.discountPercent}%
                    </Text>
                  </View>
                )}
              </View>

              {plan.savings > 0 && (
                <Text style={styles.savingsText}>
                  Tiết kiệm {formatCurrency(plan.savings)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Info */}
        <View style={styles.securitySection}>
          <Text style={styles.securityTitle}>🔒 Thanh toán an toàn</Text>
          <Text style={styles.securityText}>
            Được bảo mật bởi PayOS - Cổng thanh toán trực tuyến hàng đầu Việt Nam. 
            Hỗ trợ thanh toán qua QR Code, Internet Banking, Ví điện tử.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {selectedPlan && (
          <View style={styles.selectedPlanSummary}>
            <Text style={styles.summaryText}>
              {selectedPlan.name} - {formatCurrency(selectedPlan.finalPrice)}
            </Text>
            {selectedPlan.discountPercent > 0 && (
              <Text style={styles.summaryDiscount}>
                Giảm {selectedPlan.discountPercent}%
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!selectedPlan || !canUpgrade) && styles.purchaseButtonDisabled
          ]}
          onPress={handlePurchase}
          disabled={!selectedPlan || !canUpgrade}
        >
          <Text style={styles.purchaseButtonText}>
            {canUpgrade ? 'Thanh toán ngay' : 'Đã có Premium'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  headerRight: {
    width: 40, // Balance the header
  },
  content: {
    flex: 1,
  },
  currentPremiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 167, 122, 0.1)',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  currentPremiumText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  benefitsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  benefitText: {
    flex: 1,
    marginLeft: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  plansSection: {
    padding: 20,
    paddingTop: 0,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPlanCard: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(47, 167, 122, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planDuration: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  savingsText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  securitySection: {
    padding: 20,
    paddingTop: 0,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedPlanSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryDiscount: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { 
  createPaymentLink, 
  checkPaymentStatus, 
  formatCurrency,
  isPaymentExpired 
} from '../services/payment';
import { updateUserPremium } from '../services/auth';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ navigation, route }) {
  const { plan, returnScreen = 'Premium' } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const statusCheckInterval = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    if (plan) {
      createPayment();
    }
    
    return () => {
      // Cleanup intervals
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paymentData && paymentStatus === 'PENDING') {
      // Start checking payment status every 5 seconds
      statusCheckInterval.current = setInterval(checkPayment, 5000);
      
      // Start countdown timer
      timerInterval.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePaymentExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [paymentData, paymentStatus]);

  const createPayment = async () => {
    setLoading(true);
    try {
      const result = await createPaymentLink(plan.id);
      
      if (result.success) {
        setPaymentData(result.paymentData);
        setPaymentStatus('PENDING');
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo liên kết thanh toán');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo thanh toán');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async () => {
    if (!paymentData || checkingPayment) return;
    
    setCheckingPayment(true);
    try {
      const result = await checkPaymentStatus(paymentData.orderId);
      
      if (result.success) {
        const status = result.status;
        setPaymentStatus(status);
        
        if (status === 'PAID') {
          handlePaymentSuccess(result);
        } else if (status === 'CANCELLED' || status === 'EXPIRED') {
          handlePaymentFailed(status);
        }
      }
    } catch (error) {
      console.log('Error checking payment status:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    // Clear intervals
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Update user premium status
    await updateUserPremium(true);

    Alert.alert(
      '🎉 Thanh toán thành công!',
      `Chúc mừng bạn đã nâng cấp lên gói ${plan.name}. Các tính năng Premium đã được kích hoạt.`,
      [
        {
          text: 'Tuyệt vời!',
          onPress: () => {
            // Navigate back to the return screen
            if (returnScreen === 'Premium') {
              navigation.goBack();
            } else {
              navigation.navigate(returnScreen);
            }
          }
        }
      ]
    );
  };

  const handlePaymentFailed = (status) => {
    // Clear intervals
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    const message = status === 'CANCELLED' 
      ? 'Thanh toán đã bị hủy' 
      : 'Thanh toán đã hết hạn';

    Alert.alert(
      'Thanh toán không thành công',
      message + '. Bạn có muốn thử lại?',
      [
        {
          text: 'Quay lại',
          style: 'cancel',
          onPress: () => navigation.goBack()
        },
        {
          text: 'Thử lại',
          onPress: () => {
            setPaymentData(null);
            setPaymentStatus('PENDING');
            setTimeRemaining(15 * 60);
            createPayment();
          }
        }
      ]
    );
  };

  const handlePaymentExpired = () => {
    handlePaymentFailed('EXPIRED');
  };

  const openPaymentUrl = () => {
    if (paymentData?.paymentUrl) {
      Linking.openURL(paymentData.paymentUrl).catch(err => {
        Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán');
      });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return Colors.success;
      case 'PENDING': return Colors.warning;
      case 'CANCELLED': 
      case 'EXPIRED': return Colors.danger;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán';
      case 'PENDING': return 'Đang chờ thanh toán';
      case 'CANCELLED': return 'Đã hủy';
      case 'EXPIRED': return 'Đã hết hạn';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tạo thanh toán...</Text>
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
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          
          <View style={styles.orderCard}>
            <View style={styles.orderInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDuration}>Thời hạn: {plan.durationDays} ngày</Text>
              {plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}
            </View>
            
            <View style={styles.priceInfo}>
              {plan.discountPercent > 0 && (
                <Text style={styles.originalPrice}>
                  {formatCurrency(plan.price)}
                </Text>
              )}
              <Text style={styles.finalPrice}>
                {formatCurrency(plan.finalPrice)}
              </Text>
            </View>
          </View>

          {paymentData && (
            <View style={styles.orderDetails}>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Mã đơn hàng:</Text>
                <Text style={styles.orderDetailValue}>{paymentData.orderId}</Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Trạng thái:</Text>
                <Text style={[styles.orderDetailValue, { color: getStatusColor(paymentStatus) }]}>
                  {getStatusText(paymentStatus)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Status */}
        {paymentData && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Thanh toán</Text>
            
            {paymentStatus === 'PENDING' && (
              <View style={styles.pendingPayment}>
                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={24} color={Colors.warning} />
                  <Text style={styles.timerText}>
                    Thời gian còn lại: {formatTime(timeRemaining)}
                  </Text>
                </View>
                
                <Text style={styles.paymentInstructions}>
                  Nhấn vào nút bên dưới để mở trang thanh toán PayOS và hoàn tất giao dịch
                </Text>
                
                <TouchableOpacity 
                  style={styles.paymentButton}
                  onPress={openPaymentUrl}
                >
                  <Ionicons name="card-outline" size={20} color={Colors.white} />
                  <Text style={styles.paymentButtonText}>
                    Thanh toán ngay
                  </Text>
                </TouchableOpacity>

                <View style={styles.paymentMethods}>
                  <Text style={styles.paymentMethodsTitle}>Phương thức thanh toán:</Text>
                  <View style={styles.methodList}>
                    <View style={styles.methodItem}>
                      <Ionicons name="qr-code-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.methodText}>QR Code</Text>
                    </View>
                    <View style={styles.methodItem}>
                      <Ionicons name="card-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.methodText}>Internet Banking</Text>
                    </View>
                    <View style={styles.methodItem}>
                      <Ionicons name="wallet-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.methodText}>Ví điện tử</Text>
                    </View>
                  </View>
                </View>

                {checkingPayment && (
                  <View style={styles.checkingStatus}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.checkingText}>Đang kiểm tra thanh toán...</Text>
                  </View>
                )}
              </View>
            )}

            {paymentStatus === 'PAID' && (
              <View style={styles.successPayment}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
                <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                <Text style={styles.successMessage}>
                  Gói Premium đã được kích hoạt cho tài khoản của bạn
                </Text>
              </View>
            )}

            {(paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED') && (
              <View style={styles.failedPayment}>
                <Ionicons name="close-circle" size={64} color={Colors.danger} />
                <Text style={styles.failedTitle}>Thanh toán không thành công</Text>
                <Text style={styles.failedMessage}>
                  {paymentStatus === 'CANCELLED' ? 'Giao dịch đã bị hủy' : 'Giao dịch đã hết hạn'}
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setPaymentData(null);
                    setPaymentStatus('PENDING');
                    setTimeRemaining(15 * 60);
                    createPayment();
                  }}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🔒 Bảo mật thanh toán</Text>
          <Text style={styles.securityText}>
            Thanh toán được bảo mật bởi PayOS với mã hóa SSL 256-bit. 
            Chúng tôi không lưu trữ thông tin thẻ tín dụng của bạn.
          </Text>
        </View>
      </ScrollView>
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
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  orderSummary: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  orderDetails: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  paymentSection: {
    padding: 20,
    paddingTop: 0,
  },
  pendingPayment: {
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  timerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warningText,
  },
  paymentInstructions: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  paymentButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: width - 80,
  },
  paymentButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentMethods: {
    width: '100%',
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  methodList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
  },
  methodItem: {
    alignItems: 'center',
    flex: 1,
  },
  methodText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  checkingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  checkingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  successPayment: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  failedPayment: {
    alignItems: 'center',
    padding: 20,
  },
  failedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.danger,
    marginTop: 16,
    marginBottom: 8,
  },
  failedMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
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
});
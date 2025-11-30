import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getPaymentHistory } from '../services/paymentService';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function PaymentHistoryScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const result = await getPaymentHistory();
      if (result.success) {
        // Chỉ lấy các giao dịch đã thanh toán
        const paidPayments = (result.payments || []).filter(p => p.status === 'PAID');
        setPayments(paidPayments);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tải lịch sử thanh toán');
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải lịch sử thanh toán');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentHistory();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa thanh toán';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PAID':
        return {
          label: 'Đã thanh toán',
          color: Colors.success,
          backgroundColor: 'rgba(47, 167, 122, 0.1)',
          icon: 'checkmark-circle',
        };
      case 'PENDING':
        return {
          label: 'Chờ thanh toán',
          color: Colors.warning,
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          icon: 'time',
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy',
          color: Colors.danger,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          icon: 'close-circle',
        };
      case 'FAILED':
        return {
          label: 'Thất bại',
          color: Colors.danger,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          icon: 'alert-circle',
        };
      default:
        return {
          label: status,
          color: Colors.textMuted,
          backgroundColor: Colors.surface,
          icon: 'help-circle',
        };
    }
  };

  const renderPaymentItem = (payment) => {
    const statusInfo = getStatusInfo(payment.status);
    
    return (
      <View key={payment.id} style={styles.paymentCard}>
        {/* Header */}
        <View style={styles.paymentHeader}>
          <View style={styles.planInfo}>
            <Ionicons name="diamond" size={20} color={Colors.primary} />
            <Text style={styles.planName}>{payment.planName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền</Text>
          <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="receipt-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
            <Text style={styles.detailValue}>{payment.orderId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailLabel}>Ngày tạo:</Text>
            <Text style={styles.detailValue}>{formatDate(payment.createdAt)}</Text>
          </View>

          {payment.paidAt && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-done-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Ngày thanh toán:</Text>
              <Text style={styles.detailValue}>{formatDate(payment.paidAt)}</Text>
            </View>
          )}

          {payment.transactionId && (
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Mã giao dịch:</Text>
              <Text style={styles.detailValue}>{payment.transactionId}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử thanh toán...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.contentPadding}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng giao dịch đã thanh toán</Text>
                <Text style={styles.summaryValue}>{payments.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng số tiền</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </Text>
              </View>
            </View>

            {/* Payment List */}
            {payments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có giao dịch đã thanh toán</Text>
                <Text style={styles.emptySubtext}>
                  Lịch sử thanh toán thành công sẽ xuất hiện ở đây
                </Text>
              </View>
            ) : (
              <View style={styles.paymentsList}>
                <Text style={styles.sectionTitle}>Danh sách giao dịch đã thanh toán</Text>
                {payments.map(payment => renderPaymentItem(payment))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  paymentsList: {
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});

// Mock Payment Service for Development/Testing
// Use this when PayOS is not configured or for testing UI without real payments

const MOCK_PLANS = [
  {
    id: 1,
    name: 'Premium 1 Tháng',
    type: 'MONTHLY',
    description: 'Gói Premium 1 tháng với đầy đủ tính năng: Không giới hạn số lượng thuốc, đồng bộ đa thiết bị, báo cáo chi tiết',
    durationDays: 30,
    price: 49000,
    discountPercent: 0,
    isActive: true,
    finalPrice: 49000,
    savings: 0,
  },
  {
    id: 2,
    name: 'Premium 1 Năm',
    type: 'YEARLY',
    description: 'Gói Premium 1 năm - Tiết kiệm 20%! Bao gồm: Không giới hạn thuốc, đồng bộ đa thiết bị, báo cáo chi tiết, hỗ trợ ưu tiên',
    durationDays: 365,
    price: 588000,
    discountPercent: 20,
    isActive: true,
    finalPrice: 470400,
    savings: 117600,
  },
  {
    id: 3,
    name: 'Premium Trọn Đời',
    type: 'LIFETIME',
    description: 'Mua một lần, sử dụng trọn đời! Tất cả tính năng Premium không giới hạn thời gian',
    durationDays: 999999,
    price: 999000,
    discountPercent: 50,
    isActive: true,
    finalPrice: 499500,
    savings: 499500,
  },
];

let mockPayments = {};

/**
 * Mock: Lấy danh sách premium plans
 */
export const getPremiumPlans = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    plans: MOCK_PLANS,
  };
};

/**
 * Mock: Tạo payment link
 */
export const createPaymentLink = async (planId, returnUrl = null, cancelUrl = null) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const plan = MOCK_PLANS.find(p => p.id === planId);
  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }
  
  const orderId = Date.now().toString();
  const mockPaymentUrl = `https://mock-payment.medtime.com/pay/${orderId}`;
  
  // Store mock payment
  mockPayments[orderId] = {
    orderId,
    planId,
    amount: plan.finalPrice,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  
  return {
    success: true,
    paymentData: {
      orderId,
      paymentUrl: mockPaymentUrl,
      amount: plan.finalPrice,
      description: plan.name,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${mockPaymentUrl}`,
    }
  };
};

/**
 * Mock: Check payment status
 */
export const checkPaymentStatus = async (orderId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const payment = mockPayments[orderId];
  if (!payment) {
    return { success: false, error: 'Payment not found' };
  }
  
  // After 10 seconds, auto-mark as PAID for testing
  const createdTime = new Date(payment.createdAt).getTime();
  const now = Date.now();
  const elapsedSeconds = (now - createdTime) / 1000;
  
  if (elapsedSeconds > 10 && payment.status === 'PENDING') {
    payment.status = 'PAID';
    payment.paidAt = new Date().toISOString();
    payment.transactionId = `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  return {
    success: true,
    status: payment.status,
    paidAt: payment.paidAt,
    transactionId: payment.transactionId,
    amount: payment.amount,
    orderId: payment.orderId,
  };
};

/**
 * Mock: Get payment history
 */
export const getPaymentHistory = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const history = Object.values(mockPayments).map(payment => {
    const plan = MOCK_PLANS.find(p => p.id === payment.planId);
    return {
      id: parseInt(payment.orderId),
      orderId: payment.orderId,
      planName: plan?.name || 'Unknown Plan',
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      transactionId: payment.transactionId,
    };
  });
  
  return {
    success: true,
    payments: history,
    pagination: {
      pageNumber: 1,
      pageSize: history.length,
      totalCount: history.length,
      totalPages: 1,
      hasNextPage: false,
    }
  };
};

/**
 * Mock: Cancel subscription
 */
export const cancelPayment = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, message: 'Đã hủy Premium subscription' };
};

/**
 * Mock: Verify callback
 */
export const verifyPaymentCallback = async (orderId, signature) => {
  return {
    success: true,
    isValid: true,
    paymentStatus: 'PAID',
  };
};

/**
 * Mock: Can upgrade check
 */
export const canUpgradeToPremium = async () => {
  return {
    success: true,
    canUpgrade: true,
    reason: null,
    currentPremiumEnd: null,
  };
};

// Export utility functions (same as real service)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const calculateSavings = (originalPrice, discountPercent) => {
  return originalPrice * (discountPercent / 100);
};

export const calculateFinalPrice = (originalPrice, discountPercent) => {
  return originalPrice - calculateSavings(originalPrice, discountPercent);
};

export const isPaymentExpired = (createdAt, expiryMinutes = 15) => {
  const createdTime = new Date(createdAt);
  const expiryTime = new Date(createdTime.getTime() + expiryMinutes * 60 * 1000);
  return new Date() > expiryTime;
};

export const getPaymentDeepLink = (paymentUrl, bankCode = null) => {
  if (bankCode) {
    const url = new URL(paymentUrl);
    url.searchParams.set('bankCode', bankCode);
    return url.toString();
  }
  return paymentUrl;
};

export default {
  getPremiumPlans,
  createPaymentLink,
  checkPaymentStatus,
  getPaymentHistory,
  verifyPaymentCallback,
  cancelPayment,
  formatCurrency,
  calculateSavings,
  calculateFinalPrice,
  isPaymentExpired,
  getPaymentDeepLink,
  canUpgradeToPremium,
};

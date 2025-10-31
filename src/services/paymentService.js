import { getAuthToken } from './auth';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';

// API helper function with authentication
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'accept': '*/*',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[PaymentAPI] Request: ${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`[PaymentAPI] Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[PaymentAPI] Error Response:`, errorText);
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          errorMessage = typeof errorData.errors === 'string' 
            ? errorData.errors 
            : JSON.stringify(errorData.errors);
        }
      } catch (e) {
        // Not JSON, use the text as is
        if (errorText) errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[PaymentAPI] Success:`, data.success);
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'API request failed');
    }
  } catch (error) {
    console.log('[PaymentAPI] Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Lấy danh sách các gói premium có sẵn
 */
export const getPremiumPlans = async () => {
  try {
    const result = await apiRequest('/payment/plans');
    
    if (result.success) {
      return {
        success: true,
        plans: result.data.map(plan => ({
          id: plan.planid,
          name: plan.planname,
          type: plan.plantype,
          description: plan.description,
          durationDays: plan.durationdays,
          price: plan.price,
          discountPercent: plan.discountpercent || 0,
          isActive: plan.isactive,
          finalPrice: plan.finalprice || plan.price,
          savings: plan.discountpercent ? plan.price * (plan.discountpercent / 100) : 0,
        }))
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tải danh sách gói Premium' };
  }
};

/**
 * Tạo payment link với PayOS cho gói premium đã chọn
 */
export const createPaymentLink = async (planId, returnUrl = null, cancelUrl = null) => {
  try {
    const requestBody = {
      planId: planId,
    };

    // Thêm return/cancel URLs nếu có
    if (returnUrl) requestBody.returnUrl = returnUrl;
    if (cancelUrl) requestBody.cancelUrl = cancelUrl;

    const result = await apiRequest('/payment/create', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (result.success) {
      return {
        success: true,
        paymentData: {
          orderId: result.data.orderId,
          paymentUrl: result.data.checkoutUrl, // Backend trả về checkoutUrl
          amount: result.data.amount,
          description: result.data.planName,
          qrCode: result.data.qrCode, // QR code URL
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tạo liên kết thanh toán' };
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkPaymentStatus = async (orderId) => {
  try {
    const result = await apiRequest(`/payment/status/${orderId}`);
    
    if (result.success) {
      return {
        success: true,
        status: result.data.status, // PENDING, PAID, CANCELLED, EXPIRED
        paidAt: result.data.paidAt,
        transactionId: result.data.transactionId,
        amount: result.data.amount,
        orderId: result.data.orderId,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể kiểm tra trạng thái thanh toán' };
  }
};

/**
 * Lấy lịch sử thanh toán của user
 */
export const getPaymentHistory = async (pageNumber = 1, pageSize = 10) => {
  try {
    const result = await apiRequest(`/payment/history`);
    
    if (result.success) {
      // Backend trả về array trực tiếp, không có pagination
      return {
        success: true,
        payments: result.data.map(payment => ({
          id: payment.paymentid,
          orderId: payment.orderid,
          planName: payment.plan?.planname || 'Premium Plan',
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdat,
          paidAt: payment.paidat,
          transactionId: payment.transactionid,
        })),
        pagination: {
          pageNumber: 1,
          pageSize: result.data.length,
          totalCount: result.data.length,
          totalPages: 1,
          hasNextPage: false,
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tải lịch sử thanh toán' };
  }
};

/**
 * Xử lý webhook callback từ PayOS (thường được gọi từ backend)
 * Hàm này chỉ để kiểm tra thông tin callback nếu cần
 */
export const verifyPaymentCallback = async (orderId, signature) => {
  try {
    const result = await apiRequest('/payment/payos-callback', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        signature,
      }),
    });

    if (result.success) {
      return {
        success: true,
        isValid: result.data.isValid,
        paymentStatus: result.data.paymentStatus,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể xác thực callback thanh toán' };
  }
};

/**
 * Hủy thanh toán hoặc hủy subscription Premium
 */
export const cancelPayment = async (orderId = null) => {
  try {
    // Nếu có orderId, có thể implement cancel payment cụ thể
    // Hiện tại backend chỉ có cancel subscription endpoint
    const result = await apiRequest('/payment/cancel-subscription', {
      method: 'POST',
    });

    if (result.success) {
      return { success: true, message: 'Đã hủy Premium subscription thành công' };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể hủy thanh toán' };
  }
};

// Utility functions

/**
 * Format currency number to VND
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Tính toán số tiền tiết kiệm
 */
export const calculateSavings = (originalPrice, discountPercent) => {
  return originalPrice * (discountPercent / 100);
};

/**
 * Tính toán giá cuối cùng sau giảm giá
 */
export const calculateFinalPrice = (originalPrice, discountPercent) => {
  return originalPrice - calculateSavings(originalPrice, discountPercent);
};

/**
 * Kiểm tra xem payment có hết hạn chưa (thường PayOS link có thời hạn)
 */
export const isPaymentExpired = (createdAt, expiryMinutes = 15) => {
  const createdTime = new Date(createdAt);
  const expiryTime = new Date(createdTime.getTime() + expiryMinutes * 60 * 1000);
  return new Date() > expiryTime;
};

/**
 * Tạo deep link để mở ứng dụng ngân hàng hoặc ví điện tử
 */
export const getPaymentDeepLink = (paymentUrl, bankCode = null) => {
  if (bankCode) {
    // Nếu có mã ngân hàng, tạo deep link cho ngân hàng cụ thể
    const url = new URL(paymentUrl);
    url.searchParams.set('bankCode', bankCode);
    return url.toString();
  }
  return paymentUrl;
};

/**
 * Kiểm tra xem user có đủ điều kiện upgrade premium không
 * Note: Backend không có endpoint này, chúng ta sẽ check trên client
 */
export const canUpgradeToPremium = async () => {
  try {
    // Có thể check thông qua payment history hoặc user info
    // Hiện tại return true để cho phép upgrade
    return {
      success: true,
      canUpgrade: true,
      reason: null,
      currentPremiumEnd: null,
    };
  } catch (error) {
    return { success: false, error: 'Không thể kiểm tra điều kiện nâng cấp' };
  }
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
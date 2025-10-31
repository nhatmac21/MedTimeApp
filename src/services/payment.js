// Payment Service Entry Point
// Automatically exports either real or mock service based on configuration

import USE_MOCK_PAYMENT from './paymentConfig';

let paymentService;

if (USE_MOCK_PAYMENT) {
  console.log('[Payment] Using MOCK payment service');
  paymentService = require('./paymentService.mock');
} else {
  console.log('[Payment] Using REAL PayOS payment service');
  paymentService = require('./paymentService');
}

// Re-export all functions
export const {
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
} = paymentService;

export default paymentService.default || paymentService;

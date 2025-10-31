// Payment Service Configuration
// Switch between real PayOS API and mock service for development

// Set to true to use mock service (no real payments)
// Set to false to use real PayOS API
const USE_MOCK_PAYMENT = false;  // ✅ USING REAL PAYOS API

// You can also check environment or other conditions
// const USE_MOCK_PAYMENT = __DEV__ || !process.env.PAYOS_CONFIGURED;

export default USE_MOCK_PAYMENT;
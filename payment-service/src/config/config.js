const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3005,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Payhere configuration
  payhere: {
    merchantId: process.env.PAYHERE_MERCHANT_ID,
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
    baseUrl: 'https://sandbox.payhere.lk/pay/checkout', // Use 'https://www.payhere.lk/pay/checkout' for production
    returnUrl: process.env.PAYHERE_RETURN_URL || 'http://localhost:3005/payment/success',
    cancelUrl: process.env.PAYHERE_CANCEL_URL || 'http://localhost:3005/payment/cancel',
    notifyUrl: process.env.PAYHERE_NOTIFY_URL || 'http://localhost:3005/payment/notify',
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_service_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Currency configuration
  currency: {
    default: 'LKR',
    supported: ['LKR', 'USD', 'GBP', 'EUR', 'AUD'],
  },

  // Payment status codes
  paymentStatus: {
    SUCCESS: '2',
    PENDING: '0',
    CANCELED: '-1',
    FAILED: '-2',
    CHARGEDBACK: '-3',
  },

  // Validation configuration
  validation: {
    phone: {
      minLength: 10,
      regex: /^\+?[\d\s-]{10,}$/,
    },
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    orderId: {
      prefix: 'ORD',
      length: 20,
    },
  },
};

module.exports = config;

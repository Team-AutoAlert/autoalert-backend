/**
 * Payment utility functions
 */

/**
 * Format currency amount
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted amount with 2 decimal places
 */
const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2);
};

/**
 * Validate currency code
 * @param {string} currency - Currency code to validate
 * @returns {boolean} - Whether the currency code is valid
 */
const isValidCurrency = (currency) => {
  const validCurrencies = ['LKR', 'USD', 'GBP', 'EUR', 'AUD'];
  return validCurrencies.includes(currency.toUpperCase());
};

/**
 * Generate a unique order ID
 * @param {string} prefix - Prefix for the order ID
 * @returns {string} - Unique order ID
 */
const generateOrderId = (prefix = 'ORD') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Format payment status
 * @param {number|string} statusCode - Status code from Payhere
 * @returns {string} - Formatted status
 */
const formatPaymentStatus = (statusCode) => {
  const statusMap = {
    '2': 'SUCCESS',
    '0': 'PENDING',
    '-1': 'CANCELED',
    '-2': 'FAILED',
    '-3': 'CHARGED_BACK',
  };
  return statusMap[statusCode] || 'UNKNOWN';
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    status: 'error',
    message,
    statusCode,
  };
};

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Formatted success response
 */
const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    status: 'success',
    message,
    data,
  };
};

module.exports = {
  formatAmount,
  isValidCurrency,
  generateOrderId,
  formatPaymentStatus,
  formatErrorResponse,
  formatSuccessResponse,
}; 
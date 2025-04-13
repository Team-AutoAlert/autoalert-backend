/**
 * Validation middleware for payment requests
 */

/**
 * Validate payment creation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePaymentCreation = (req, res, next) => {
  const {
    orderId,
    amount,
    currency,
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    country,
  } = req.body;

  // Check required fields
  if (!orderId || !amount || !currency || !firstName || !email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  // Validate amount is a positive number
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
    });
  }

  // Validate currency is a valid code (3 characters)
  if (currency.length !== 3) {
    return res.status(400).json({
      success: false,
      message: 'Currency must be a 3-character code',
    });
  }

  // If phone is provided, validate format
  if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format',
    });
  }

  // All validations passed
  next();
};

/**
 * Validate payment notification request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validatePaymentNotification = (req, res, next) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;

  // Check required fields
  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields in payment notification',
    });
  }

  // Validate amount is a positive number
  if (isNaN(payhere_amount) || parseFloat(payhere_amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
    });
  }

  // Validate currency is a valid code (3 characters)
  if (payhere_currency.length !== 3) {
    return res.status(400).json({
      success: false,
      message: 'Currency must be a 3-character code',
    });
  }

  // All validations passed
  next();
};

module.exports = {
  validatePaymentCreation,
  validatePaymentNotification,
}; 
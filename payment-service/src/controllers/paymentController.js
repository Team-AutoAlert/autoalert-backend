const paymentService = require('../services/paymentService');
const { formatSuccessResponse, formatErrorResponse, formatPaymentStatus } = require('../utils/payment.utils');
const { ApiError } = require('../middleware/errorHandler');

// Create a new payment
const createPayment = async (req, res, next) => {
  try {
    const paymentData = paymentService.createPaymentData(req.body);
    res.status(200).json(formatSuccessResponse(paymentData));
  } catch (error) {
    next(new ApiError(500, 'Error creating payment'));
  }
};

// Handle successful payment
const handleSuccess = async (req, res, next) => {
  try {
    const paymentData = req.body;
    console.log('Payment successful:', paymentData);
    
    const result = paymentService.processPaymentNotification(paymentData);
    
    if (!result.success) {
      throw new ApiError(400, result.message);
    }

    const formattedStatus = formatPaymentStatus(paymentData.status_code);
    res.status(200).json(formatSuccessResponse({
      ...result.data,
      status: formattedStatus
    }, 'Payment successful'));
  } catch (error) {
    next(error);
  }
};

// Handle cancelled payment
const handleCancel = async (req, res, next) => {
  try {
    const paymentData = req.body;
    console.log('Payment cancelled:', paymentData);
    
    res.status(200).json(formatSuccessResponse({
      orderId: paymentData.order_id,
      status: formatPaymentStatus('-1')
    }, 'Payment cancelled'));
  } catch (error) {
    next(error);
  }
};

// Handle payment notification
const handleNotify = async (req, res, next) => {
  try {
    const paymentData = req.body;
    console.log('Payment notification received:', paymentData);
    
    const result = paymentService.processPaymentNotification(paymentData);
    
    if (!result.success) {
      throw new ApiError(400, result.message);
    }

    const formattedStatus = formatPaymentStatus(paymentData.status_code);
    res.status(200).json(formatSuccessResponse({
      ...result.data,
      status: formattedStatus
    }, 'Payment notification processed'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  handleSuccess,
  handleCancel,
  handleNotify,
}; 
const crypto = require('crypto');
const axios = require('axios');

/**
 * Payment service to handle payment-related business logic
 */
class PaymentService {
  /**
   * Generate hash for payment verification
   * @param {Object} params - Parameters for hash generation
   * @returns {String} - Generated hash
   */
  generateHash(params) {
    const { merchantId, orderId, amount, currency, merchantSecret } = params;
    
    return crypto
      .createHash('md5')
      .update(
        `${merchantId}${orderId}${amount}${currency}${crypto
          .createHash('md5')
          .update(merchantSecret)
          .digest('hex')}`
      )
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Verify payment hash from Payhere
   * @param {Object} params - Parameters for hash verification
   * @returns {Boolean} - Whether the hash is valid
   */
  verifyHash(params) {
    const { merchantId, orderId, amount, currency, statusCode, md5sig, merchantSecret } = params;
    
    const localHash = crypto
      .createHash('md5')
      .update(
        `${merchantId}${orderId}${amount}${currency}${statusCode}${crypto
          .createHash('md5')
          .update(merchantSecret)
          .digest('hex')
          .toUpperCase()}`
      )
      .digest('hex')
      .toUpperCase();

    return localHash === md5sig;
  }

  /**
   * Create payment data for Payhere
   * @param {Object} paymentDetails - Payment details
   * @returns {Object} - Payment data for Payhere
   */
  createPaymentData(paymentDetails) {
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
    } = paymentDetails;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    
    const hashedSecret = this.generateHash({
      merchantId,
      orderId,
      amount,
      currency,
      merchantSecret,
    });

    return {
      merchant_id: merchantId,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: 'Order ' + orderId,
      amount,
      currency,
      hash: hashedSecret,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      city,
      country,
    };
  }

  /**
   * Process payment notification
   * @param {Object} notificationData - Payment notification data
   * @returns {Object} - Processed notification result
   */
  processPaymentNotification(notificationData) {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = notificationData;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    const isValid = this.verifyHash({
      merchantId: merchant_id,
      orderId: order_id,
      amount: payhere_amount,
      currency: payhere_currency,
      statusCode: status_code,
      md5sig,
      merchantSecret,
    });

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid payment signature',
      };
    }

    // Here you would typically update your database with the payment status
    // For example: await db.payments.update({ orderId: order_id }, { status: status_code });

    return {
      success: true,
      message: 'Payment notification processed',
      data: notificationData,
    };
  }
}

module.exports = new PaymentService(); 
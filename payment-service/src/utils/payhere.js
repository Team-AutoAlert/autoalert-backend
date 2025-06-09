const axios = require('axios');
const crypto = require('crypto');
const logger = require('./logger');

class PayHere {
    constructor(config) {
        this.config = config;
        this.baseUrl = 'https://sandbox.payhere.lk/pay/checkout';
    }

    // Generate PayHere hash
    generateHash() {
        const {
            merchant_id,
            order_id,
            amount,
            currency
        } = this.config;

        // First, generate the merchant secret hash
        const merchantSecretHash = crypto
            .createHash('md5')
            .update(process.env.PAYHERE_MERCHANT_SECRET)
            .digest('hex')
            .toUpperCase();

        // Then generate the final hash
        const hash = crypto
            .createHash('md5')
            .update(
                merchant_id + 
                order_id + 
                amount.value + 
                currency.value + 
                merchantSecretHash
            )
            .digest('hex')
            .toUpperCase();

        logger.info('Generated PayHere hash:', {
            merchant_id,
            order_id,
            amount: amount.value,
            currency: currency.value,
            merchantSecretHash,
            hash
        });

        return hash;
    }

    // Create payment session
    async createPaymentSession() {
        try {
            const hash = this.generateHash();
            
            // Prepare payment data
            const paymentData = {
                sandbox: true,
                merchant_id: this.config.merchant_id,
                return_url: this.config.return_url,
                cancel_url: this.config.cancel_url,
                notify_url: this.config.notify_url,
                first_name: this.config.first_name,
                last_name: this.config.last_name,
                email: this.config.email,
                phone: this.config.phone,
                address: this.config.address,
                city: this.config.city,
                country: this.config.country,
                order_id: this.config.order_id,
                items: 'VAN',
                currency: this.config.currency.value,
                amount: this.config.amount.value,
                hash: hash
            };

            // Log the complete request for debugging
            logger.info('PayHere payment request details:', {
                merchant_id: this.config.merchant_id,
                order_id: this.config.order_id,
                amount: this.config.amount.value,
                currency: this.config.currency.value,
                items: 'VAN',
                hash: hash,
                merchant_secret_length: process.env.PAYHERE_MERCHANT_SECRET ? process.env.PAYHERE_MERCHANT_SECRET.length : 0
            });

            return {
                payment_url: this.baseUrl,
                payment_data: paymentData
            };
        } catch (error) {
            logger.error('PayHere payment session creation failed:', {
                error: error.message,
                stack: error.stack,
                config: {
                    ...this.config,
                    merchant_secret_length: process.env.PAYHERE_MERCHANT_SECRET ? process.env.PAYHERE_MERCHANT_SECRET.length : 0
                }
            });
            throw error;
        }
    }

    // Verify payment
    async verifyPayment(paymentId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/payment/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.PAYHERE_API_KEY}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('PayHere payment verification failed:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = PayHere; 
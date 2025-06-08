const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
    constructor() {
        this.baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
    }

    async sendSMS(phoneNumber, message) {
        try {
            const response = await axios.post(`${this.baseURL}/api/notifications/send`, {
                phoneNumber,
                message
            });
            return response.data;
        } catch (error) {
            logger.error('Failed to send SMS:', error);
            throw new Error('SMS sending failed');
        }
    }

    async sendVerificationSMS(phoneNumber, code) {
        const message = `Your AutoAlert verification code is: ${code}. Valid for 10 minutes.`;
        return this.sendSMS(phoneNumber, message);
    }
}

module.exports = new NotificationService();

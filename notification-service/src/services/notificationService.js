const twilio = require('twilio');
const Device = require('../models/device');
const logger = require('../utils/logger');

class NotificationService {
    constructor() {
        // Add logging to debug credential loading
        logger.info('Initializing Twilio client...');
        logger.info(`TWILIO_ACCOUNT_SID exists: ${!!process.env.TWILIO_ACCOUNT_SID}`);
        logger.info(`TWILIO_AUTH_TOKEN exists: ${!!process.env.TWILIO_AUTH_TOKEN}`);

        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('Twilio credentials are not properly configured in environment variables');
        }

        try {
            this.twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID.trim(),
                process.env.TWILIO_AUTH_TOKEN.trim()
            );
            logger.info('Twilio client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Twilio client:', error);
            throw error;
        }
    }

    async registerDevice(userId, phoneNumber) {
        try {
            // Validate phone number format (E.164 format)
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }

            const device = await Device.findOneAndUpdate(
                { phoneNumber },
                { 
                    userId,
                    lastUsed: new Date() 
                },
                { upsert: true, new: true }
            );

            logger.info(`Device registered successfully for user: ${userId}`);
            return device;
        } catch (error) {
            logger.error('Error registering device:', error);
            throw error;
        }
    }

    async sendSMS(userId, message) {
        try {
            // Get all devices (phone numbers) for the user
            const devices = await Device.find({ userId });
            
            if (!devices.length) {
                logger.warn(`No devices found for user: ${userId}`);
                return { success: false, message: 'No devices registered' };
            }

            const results = await Promise.all(
                devices.map(async (device) => {
                    try {
                        const result = await this.twilioClient.messages.create({
                            body: message,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: device.phoneNumber
                        });

                        return {
                            success: true,
                            phoneNumber: device.phoneNumber,
                            messageId: result.sid
                        };
                    } catch (error) {
                        logger.error(`SMS sending failed for ${device.phoneNumber}:`, error);
                        return {
                            success: false,
                            phoneNumber: device.phoneNumber,
                            error: error.message
                        };
                    }
                })
            );

            logger.info(`SMS sent to ${results.filter(r => r.success).length} devices`);
            return results;
        } catch (error) {
            logger.error('Error sending SMS:', error);
            throw error;
        }
    }

    // Method to send bulk SMS
    async sendBulkSMS(userIds, message) {
        try {
            const results = await Promise.all(
                userIds.map(userId => this.sendSMS(userId, message))
            );
            return results;
        } catch (error) {
            logger.error('Error sending bulk SMS:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();

const twilio = require('twilio');
const Device = require('../models/device');
const mongoose = require('mongoose');
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

    async registerDevice(userId, phoneNumber, fcmToken) {
        try {
            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                logger.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
                throw new Error('Database connection is not available');
            }

            // Format phone number if provided
            if (phoneNumber && !phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }

            // Create or update device document
            let device;
            if (fcmToken) {
                // Try to find existing device with this FCM token
                device = await Device.findOne({ fcmToken });
            }

            if (!device && phoneNumber) {
                // Try to find existing device with this phone number
                device = await Device.findOne({ phoneNumber });
            }

            if (!device) {
                // Create new device if none exists
                device = new Device({
                    userId,
                    phoneNumber,
                    fcmToken,
                    lastUsed: new Date()
                });
            } else {
                // Update existing device
                device.userId = userId;
                device.phoneNumber = phoneNumber;
                device.fcmToken = fcmToken;
                device.lastUsed = new Date();
            }

            // Save the device
            const savedDevice = await device.save();
            
            logger.info(`Device registered successfully for user: ${userId}`, {
                deviceId: savedDevice._id,
                database: mongoose.connection.db.databaseName,
                collection: Device.collection.collectionName
            });

            return savedDevice;
        } catch (error) {
            logger.error('Error registering device:', {
                error: error.message,
                stack: error.stack,
                userId,
                phoneNumber
            });
            throw error;
        }
    }

    // Keep the SMS sending functionality for verifications
    async sendVerificationSMS(phoneNumber, message) {
        try {
            const result = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });

            return {
                success: true,
                messageId: result.sid
            };
        } catch (error) {
            logger.error(`SMS sending failed for ${phoneNumber}:`, error);
            return {
                success: false,
                error: error.message
            };
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

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

    async registerDevice(userId, phoneNumber) {
        try {
            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                logger.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
                throw new Error('Database connection is not available');
            }

            // Validate phone number format (E.164 format)
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }

            // Create a new device document
            const device = new Device({
                userId,
                phoneNumber,
                lastUsed: new Date()
            });

            // Save the device - this will create the database and collection if they don't exist
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

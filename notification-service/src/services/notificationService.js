const admin = require('../config/firebase');
const Device = require('../models/device');
const logger = require('../utils/logger');

class NotificationService {
    async registerDevice(userId, deviceToken, platform) {
        try {
            const device = await Device.findOneAndUpdate(
                { deviceToken },
                { userId, platform, lastUsed: new Date() },
                { upsert: true, new: true }
            );
            logger.info(`Device registered successfully for user: ${userId}`);
            return device;
        } catch (error) {
            logger.error('Error registering device:', error);
            throw error;
        }
    }

    async sendNotification(userId, title, body, data = {}) {
        try {
            // Get all devices for the user
            const devices = await Device.find({ userId });
            if (!devices.length) {
                logger.warn(`No devices found for user: ${userId}`);
                return { success: false, message: 'No devices registered' };
            }

            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString()
                }
            };

            // Send to all devices
            const results = await Promise.all(
                devices.map(async (device) => {
                    try {
                        message.token = device.deviceToken;
                        const response = await admin.messaging().send(message);
                        return { success: true, deviceToken: device.deviceToken, messageId: response };
                    } catch (error) {
                        // If token is invalid, remove it
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            await Device.deleteOne({ deviceToken: device.deviceToken });
                        }
                        return { success: false, deviceToken: device.deviceToken, error: error.message };
                    }
                })
            );

            logger.info(`Notifications sent to ${results.filter(r => r.success).length} devices`);
            return results;
        } catch (error) {
            logger.error('Error sending notifications:', error);
            throw error;
        }
    }

    async sendTopicNotification(topic, title, body, data = {}) {
        try {
            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString()
                },
                topic
            };

            const response = await admin.messaging().send(message);
            logger.info(`Topic notification sent successfully to ${topic}`);
            return { success: true, messageId: response };
        } catch (error) {
            logger.error(`Error sending topic notification to ${topic}:`, error);
            throw error;
        }
    }

    async subscribeToTopic(deviceTokens, topic) {
        try {
            const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
            logger.info(`Successfully subscribed to topic: ${topic}`);
            return response;
        } catch (error) {
            logger.error(`Error subscribing to topic ${topic}:`, error);
            throw error;
        }
    }

    async unsubscribeFromTopic(deviceTokens, topic) {
        try {
            const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
            logger.info(`Successfully unsubscribed from topic: ${topic}`);
            return response;
        } catch (error) {
            logger.error(`Error unsubscribing from topic ${topic}:`, error);
            throw error;
        }
    }
}

module.exports = new NotificationService();

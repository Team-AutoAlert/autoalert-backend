const admin = require('../config/firebase');
const Device = require('../models/device');
const logger = require('../utils/logger');

class PushNotificationService {
    async sendPushNotification(userId, message, data = {}) {
        try {
            // Get all devices for the user
            const devices = await Device.find({ userId, fcmToken: { $exists: true, $ne: null } });
            
            if (!devices.length) {
                logger.warn(`No FCM devices found for user: ${userId}`);
                return { success: false, message: 'No FCM devices registered' };
            }

            const results = await Promise.all(
                devices.map(async (device) => {
                    try {
                        const notification = {
                            token: device.fcmToken,
                            notification: {
                                title: 'Auto Alert',
                                body: message
                            },
                            data: {
                                ...data,
                                userId,
                                timestamp: new Date().toISOString()
                            }
                        };

                        const result = await admin.messaging().send(notification);

                        return {
                            success: true,
                            deviceId: device._id,
                            messageId: result
                        };
                    } catch (error) {
                        logger.error(`Push notification failed for device ${device._id}:`, error);
                        
                        // Handle invalid token
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            // Remove invalid token
                            device.fcmToken = null;
                            await device.save();
                        }

                        return {
                            success: false,
                            deviceId: device._id,
                            error: error.message
                        };
                    }
                })
            );

            logger.info(`Push notifications sent to ${results.filter(r => r.success).length} devices`);
            return results;
        } catch (error) {
            logger.error('Error sending push notification:', error);
            throw error;
        }
    }

    async sendBulkPushNotification(userIds, message, data = {}) {
        try {
            const results = await Promise.all(
                userIds.map(userId => this.sendPushNotification(userId, message, data))
            );
            return results;
        } catch (error) {
            logger.error('Error sending bulk push notifications:', error);
            throw error;
        }
    }
}

module.exports = new PushNotificationService();
const notificationService = require('../services/notificationService');
const { validateDevice, validateNotification, validateBulkNotification } = require('../utils/validation');
const logger = require('../utils/logger');

class NotificationController {
    async registerDevice(req, res) {
        try {
            const { error } = validateDevice(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userId, phoneNumber } = req.body;
            const device = await notificationService.registerDevice(userId, phoneNumber);
            res.status(201).json(device);
        } catch (error) {
            logger.error('Error in registerDevice:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendNotification(req, res) {
        try {
            const { error } = validateNotification(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userId, message } = req.body;
            const result = await notificationService.sendSMS(userId, message);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendBulkNotification(req, res) {
        try {
            const { error } = validateBulkNotification(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userIds, message } = req.body;
            const result = await notificationService.sendBulkSMS(userIds, message);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendBulkNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new NotificationController();

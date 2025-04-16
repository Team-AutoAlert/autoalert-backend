const notificationService = require('../services/notificationService');
const { validateNotification, validateDevice } = require('../utils/validation');
const logger = require('../utils/logger');

class NotificationController {
    async registerDevice(req, res) {
        try {
            const { error } = validateDevice(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { userId, deviceToken, platform } = req.body;
            const device = await notificationService.registerDevice(userId, deviceToken, platform);
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

            const { userId, title, body, data } = req.body;
            const result = await notificationService.sendNotification(userId, title, body, data);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendTopicNotification(req, res) {
        try {
            const { topic, title, body, data } = req.body;
            const result = await notificationService.sendTopicNotification(topic, title, body, data);
            res.json(result);
        } catch (error) {
            logger.error('Error in sendTopicNotification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async subscribeToTopic(req, res) {
        try {
            const { deviceTokens, topic } = req.body;
            const result = await notificationService.subscribeToTopic(deviceTokens, topic);
            res.json(result);
        } catch (error) {
            logger.error('Error in subscribeToTopic:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async unsubscribeFromTopic(req, res) {
        try {
            const { deviceTokens, topic } = req.body;
            const result = await notificationService.unsubscribeFromTopic(deviceTokens, topic);
            res.json(result);
        } catch (error) {
            logger.error('Error in unsubscribeFromTopic:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new NotificationController();

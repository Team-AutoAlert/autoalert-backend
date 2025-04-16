const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Device registration
router.post('/devices', notificationController.registerDevice);

// Send notifications
router.post('/send', notificationController.sendNotification);
router.post('/send/topic', notificationController.sendTopicNotification);

// Topic management
router.post('/topic/subscribe', notificationController.subscribeToTopic);
router.post('/topic/unsubscribe', notificationController.unsubscribeFromTopic);

module.exports = router;

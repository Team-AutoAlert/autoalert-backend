const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Device registration
router.post('/devices', notificationController.registerDevice);

// Send notifications
router.post('/send', notificationController.sendNotification);
router.post('/send/bulk', notificationController.sendBulkNotification);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

module.exports = router;

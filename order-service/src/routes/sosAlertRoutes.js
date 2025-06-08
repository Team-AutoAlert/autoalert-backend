const express = require('express');
const router = express.Router();
const sosAlertController = require('../controllers/sosAlertController');

// Get all SOS alerts with filtering and pagination
router.get('/', sosAlertController.getAllSOSAlerts);

// Get all active SOS alerts
router.get('/active', sosAlertController.getActiveSOSAlerts);

// Create a new SOS alert
router.post('/', sosAlertController.createSOSAlert);

// Accept SOS alert
router.post('/:alertId/accept', sosAlertController.acceptSOSAlert);

// Complete SOS alert
router.post('/:alertId/complete', sosAlertController.completeSOSAlert);

module.exports = router; 
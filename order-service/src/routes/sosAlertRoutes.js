const express = require('express');
const router = express.Router();
const sosAlertController = require('../controllers/sosAlertController');

// Create a new SOS alert
router.post('/', sosAlertController.createSOSAlert);

// Get all SOS alerts with filtering and pagination
router.get('/', sosAlertController.getAllSOSAlerts);

// Get all active SOS alerts
router.get('/active', sosAlertController.getActiveSOSAlerts);

// Get active SOS alerts for a mechanic with the matching specialization
router.get('/:mechanicId/active', sosAlertController.getActiveSOSAlertsForMech);

// Get specific request status and mechanic details
router.get('/status/:alertId', sosAlertController.getSOSAlertStatus);

// Accept SOS alert
router.post('/accept', sosAlertController.acceptSOSAlert);

// Complete SOS alert
router.post('/complete', sosAlertController.completeSOSAlert);

module.exports = router; 
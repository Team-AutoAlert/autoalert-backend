const express = require('express');
const router = express.Router();
const SOSController = require('../controllers/SOSController');

// Create a new SOS alert
router.post('/', SOSController.createSOSAlert);

// Get SOS alert by ID
router.get('/:sosAlertId', SOSController.getSOSAlertById);

// Start call
router.post('/:sosAlertId/call/start', SOSController.startCall);

// End call
router.post('/:sosAlertId/call/end', SOSController.endCall);

// Update resolution status
router.patch('/:sosAlertId/resolution', SOSController.updateResolutionStatus);

module.exports = router; 
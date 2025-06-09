const express = require('express');
const router = express.Router();
const nearbyMechanicController = require('../controllers/nearbyMechanicController');

// List nearby mechanics
router.get('/list/:driverId', nearbyMechanicController.listNearbyMechanics);

// Send hire request
router.post('/hire/:mechanicId', nearbyMechanicController.sendHireRequest);

// List hire requests by mechanic
router.get('/requests/:mechanicId', nearbyMechanicController.listHireRequests);

// Get specific request status and mechanic details
router.get('/requests/status/:requestId', nearbyMechanicController.getRequestStatus);

// Accept hire request
router.post('/requests/accept', nearbyMechanicController.acceptHireRequest);

// Track mechanic
router.get('/track/:requestId', nearbyMechanicController.trackMechanic);

// Complete job and generate bill
router.post('/requests/complete', nearbyMechanicController.completeJob);

module.exports = router; 
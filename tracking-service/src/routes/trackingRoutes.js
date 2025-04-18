const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Location updates
router.post('/location', trackingController.updateLocation);

// Find nearby mechanics
router.get('/mechanics/nearby', trackingController.findNearbyMechanics);

// Tracking sessions
router.post('/sessions', trackingController.startTracking);
router.put('/sessions/:sessionId', trackingController.updateTrackingSession);
router.put('/sessions/:sessionId/end', trackingController.endTracking);

module.exports = router;

const express = require('express');
const router = express.Router();
const OnSiteController = require('../controllers/OnSiteController');

// Create a new on-site service
router.post('/', OnSiteController.createOnSiteService);

// Get on-site service by ID
router.get('/:serviceId', OnSiteController.getOnSiteServiceById);

// Update estimated arrival time
router.patch('/:serviceId/arrival-time', OnSiteController.updateArrivalTime);

// Mark mechanic as arrived
router.post('/:serviceId/arrived', OnSiteController.markArrived);

// Start service
router.post('/:serviceId/start', OnSiteController.startService);

// Complete service
router.post('/:serviceId/complete', OnSiteController.completeService);

module.exports = router; 
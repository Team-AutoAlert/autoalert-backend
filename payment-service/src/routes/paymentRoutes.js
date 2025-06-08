const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Bill generation and management
router.post('/bills', paymentController.generateBill);
router.post('/nearby-mech/bills', paymentController.generateNearbyBill);
router.get('/bills', paymentController.getAllBills);
router.get('/bills/driver/:driverId', paymentController.getBillsByDriver);
router.get('/bills/mechanic/:mechanicId', paymentController.getBillsByMechanic);

// Payment processing
router.post('/bills/:billId/process', paymentController.processPayment);
router.get('/bills/:billId/status', paymentController.getPaymentStatus);

module.exports = router; 
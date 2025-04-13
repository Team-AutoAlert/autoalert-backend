const express = require('express');
const router = express.Router();
const { createPayment, handleSuccess, handleCancel, handleNotify } = require('../controllers/payment.controller');

// Create a new payment
router.post('/create', createPayment);

// Payment callback routes
router.post('/success', handleSuccess);
router.post('/cancel', handleCancel);
router.post('/notify', handleNotify);

module.exports = router; 
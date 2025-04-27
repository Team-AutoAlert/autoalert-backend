const express = require('express');
const router = express.Router();
const BillController = require('../controllers/BillController');

// Create a new bill
router.post('/', BillController.createBill);

// Get bill by ID
router.get('/:billId', BillController.getBillById);

// Approve bill
router.post('/:billId/approve', BillController.approveBill);

// Dispute bill
router.post('/:billId/dispute', BillController.disputeBill);

// Resolve dispute
router.post('/:billId/resolve', BillController.resolveDispute);

// Mark bill as paid
router.post('/:billId/pay', BillController.markBillAsPaid);

module.exports = router; 
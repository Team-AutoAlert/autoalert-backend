const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
// Create a new order
router.post('/', OrderController.createOrder);

// Get order by ID
router.get('/:orderId', OrderController.getOrderById);

// Update order status
router.patch('/:orderId/status', OrderController.updateOrderStatus);

// Assign mechanic to order
router.patch('/:orderId/assign', OrderController.assignMechanic);

// Search nearby mechanics
router.get('/search/mechanics', OrderController.searchNearbyMechanics);

// Close order
router.patch('/:orderId/close', OrderController.closeOrder);

module.exports = router; 
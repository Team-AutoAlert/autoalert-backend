const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-token', authController.verifyToken);

// Protected routes
router.put('/role', [
  verifyToken, 
  checkRole(['admin']), 
  authController.updateRole
]);

module.exports = router; 
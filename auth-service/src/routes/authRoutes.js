const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, verifyPhone, verifyToken, resetPassword, updateRole } = require('../controllers/authController');
const { checkRole } = require('../middleware/roleCheck');
const logger = require('../utils/logger');

// Verify routes are defined
console.log('Auth Controller Methods:', {
    register: typeof register,
    login: typeof login,
    verifyEmail: typeof verifyEmail,
    verifyPhone: typeof verifyPhone
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/verify-token', verifyToken);
router.post('/verify-email', verifyEmail);
router.post('/verify-phone', (req, res) => {
    verifyPhone(req, res).catch(error => {
        logger.error('Phone verification route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    });
});


// Protected routes
router.put('/role', [
  verifyToken, 
  checkRole(['admin']), 
  updateRole
]);

router.put('/update-role', updateRole);

module.exports = router; 
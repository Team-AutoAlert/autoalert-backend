const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const authenticate = require('../middleware/auth');

router.post('/', userController.createUser);
router.get('/', userController.listUsers);
router.get('/:userId', userController.getUser);
router.get('/:userId/profile', userController.getUserProfile);
router.put('/:userId', userController.updateUser);
router.put('/:userId/profile', userController.updateUserProfile);
router.delete('/:userId', userController.deleteUser);

// Vehicle routes
router.post('/:userId/vehicles', userController.addVehicle);
router.get('/:userId/vehicles', userController.getVehicles);
router.put('/:userId/vehicles/:vehicleId', userController.updateVehicle);
router.delete('/:userId/vehicles/:vehicleId', userController.deleteVehicle);

// Add new routes for phone number related queries
router.get('/search/phone', userController.findByPhone);
router.get('/:userId/profile/with-phone', userController.getUserProfileWithPhone);

// Public routes
router.post('/register', userController.register);
router.get('/email/:email', userController.getUserByEmail);

// Protected routes
router.use(authenticate);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/vehicles', userController.getVehicles);
router.post('/vehicles', userController.addVehicle);
router.put('/vehicles/:vehicleId', userController.updateVehicle);
router.delete('/vehicles/:vehicleId', userController.deleteVehicle);

module.exports = router; 
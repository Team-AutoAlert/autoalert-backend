const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

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

module.exports = router; 
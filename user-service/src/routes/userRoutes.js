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

module.exports = router; 
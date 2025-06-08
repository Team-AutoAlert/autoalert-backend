const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');
const userController = require('../controllers/userController');

// Create user
router.post('/', async (req, res) => {
    try {
        // Create the user first
        const user = await User.create(req.body);
        
        // Create the user profile
        const userProfile = new UserProfile({
            userId: user.userId,
            role: user.role,
            phoneNumber: user.phoneNumber,
            ...(user.role === 'driver' ? { driverDetails: {} } : { mechanicDetails: {} })
        });
        await userProfile.save();

        res.status(201).json({
            success: true,
            data: { user, profile: userProfile }
        });
    } catch (error) {
        logger.error('Create user error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get all users
router.get('/', (req, res) => {
    User.find()
        .then(users => {
            res.json({
                success: true,
                data: users
            });
        })
        .catch(error => {
            logger.error('Get all users error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        });
});

// Search by phone
router.get('/search/phone', (req, res) => {
    const { phoneNumber } = req.query;
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'Phone number is required'
        });
    }
    
    User.findOne({ phoneNumber })
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        })
        .catch(error => {
            logger.error('Find by phone error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        });
});

// Get user by ID
router.get('/:userId', (req, res) => {
    User.findOne({ userId: req.params.userId })
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        })
        .catch(error => {
            logger.error('Get user by ID error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        });
});

// Verify phone
router.patch('/:userId/verify-phone', (req, res) => {
    User.findOneAndUpdate(
        { userId: req.params.userId },
        { isPhoneVerified: true },
        { new: true }
    )
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        })
        .catch(error => {
            logger.error('Verify phone error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        });
});

// Verify email
router.patch('/:userId/verify-email', (req, res) => {
    User.findByIdAndUpdate(
        req.params.userId,
        { isEmailVerified: true },
        { new: true }
    )
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        })
        .catch(error => {
            logger.error('Verify email error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        });
});

// Update user
router.patch('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Remove any fields that shouldn't be updated
        delete updateData.userId;
        delete updateData.role;
        delete updateData.email;

        // Update user
        const user = await User.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update user profile if profile-related fields are present
        const profileUpdateData = {};
        if (updateData.phoneNumber) {
            profileUpdateData.phoneNumber = updateData.phoneNumber;
        }
        if (updateData.driverDetails) {
            profileUpdateData.driverDetails = updateData.driverDetails;
        }
        if (updateData.mechanicDetails) {
            profileUpdateData.mechanicDetails = updateData.mechanicDetails;
        }

        if (Object.keys(profileUpdateData).length > 0) {
            const userProfile = await UserProfile.findOneAndUpdate(
                { userId },
                { $set: profileUpdateData },
                { new: true, runValidators: true }
            );

            if (!userProfile) {
                logger.warn(`User profile not found for user ${userId}`);
            }
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Vehicle Management Routes
router.get('/:userId/vehicles', userController.getVehicles);
router.delete('/:userId/vehicles/:vehicleId', userController.deleteVehicle);

// Profile Management Routes
router.get('/:userId/profile', userController.getUserProfile);

// Search and List Routes
router.get('/search/phone', userController.findByPhone);
router.get('/search/email/:email', userController.getUserByEmail);
router.get('/list', userController.listUsers);

module.exports = router; 
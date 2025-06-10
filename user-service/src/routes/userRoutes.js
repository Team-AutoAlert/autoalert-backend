const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');
const userController = require('../controllers/userController');
const userService = require('../services/userService');
const { validateUser } = require('../middleware/validation');

// Create user
router.post('/', async (req, res) => {
    try {
        // Validate user data
        await validateUser(req.body);
        
        // Create user using service
        const result = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Create user error:', {
            error: error.message,
            stack: error.stack,
            body: { ...req.body, password: undefined }
        });

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.message
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Duplicate key error',
                details: 'A user with this ID, email, or phone number already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
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

// Profile Management Routes
router.get('/:userId/profile', userController.getUserProfile);

// Search and List Routes
router.get('/search/phone', userController.findByPhone);
router.get('/search/email/:email', userController.getUserByEmail);
router.get('/list', userController.listUsers);

// Vehicle routes
// Add vehicle
router.post('/:userId/vehicles', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.params.userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        if (userProfile.role !== 'driver') {
            return res.status(400).json({
                success: false,
                error: 'Only drivers can add vehicles'
            });
        }

        // Check if vehicle with same registration number already exists
        const existingVehicle = userProfile.driverDetails.vehicles.find(
            v => v.registrationNumber === req.body.registrationNumber
        );
        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                error: 'Vehicle with this registration number already exists'
            });
        }

        // Add the vehicle
        userProfile.driverDetails.vehicles.push(req.body);
        userProfile.driverDetails.vehicleCount = userProfile.driverDetails.vehicles.length;
        await userProfile.save();

        res.status(201).json({
            success: true,
            data: userProfile.driverDetails.vehicles[userProfile.driverDetails.vehicles.length - 1]
        });
    } catch (error) {
        logger.error('Add vehicle error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get all vehicles for a user
router.get('/:userId/vehicles', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.params.userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }
        res.json({
            success: true,
            data: userProfile.driverDetails?.vehicles || []
        });
    } catch (error) {
        logger.error('Get vehicles error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get vehicle by registration number
router.get('/:userId/vehicles/:registrationNumber', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.params.userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const vehicle = userProfile.driverDetails?.vehicles?.find(
            v => v.registrationNumber === req.params.registrationNumber
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        logger.error('Get vehicle by registration number error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update vehicle
router.put('/:userId/vehicles/:registrationNumber', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.params.userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const vehicleIndex = userProfile.driverDetails.vehicles.findIndex(
            v => v.registrationNumber === req.params.registrationNumber
        );
        if (vehicleIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }

        // If registration number is being updated, check if new one already exists
        if (req.body.registrationNumber && req.body.registrationNumber !== req.params.registrationNumber) {
            const existingVehicle = userProfile.driverDetails.vehicles.find(
                v => v.registrationNumber === req.body.registrationNumber
            );
            if (existingVehicle) {
                return res.status(400).json({
                    success: false,
                    error: 'Vehicle with this registration number already exists'
                });
            }
        }

        // Update vehicle data
        userProfile.driverDetails.vehicles[vehicleIndex] = {
            ...userProfile.driverDetails.vehicles[vehicleIndex].toObject(),
            ...req.body
        };

        await userProfile.save();
        res.json({
            success: true,
            data: userProfile.driverDetails.vehicles[vehicleIndex]
        });
    } catch (error) {
        logger.error('Update vehicle error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Delete vehicle
router.delete('/:userId/vehicles/:registrationNumber', async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.params.userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const initialLength = userProfile.driverDetails.vehicles.length;
        userProfile.driverDetails.vehicles = userProfile.driverDetails.vehicles.filter(
            v => v.registrationNumber !== req.params.registrationNumber
        );

        if (userProfile.driverDetails.vehicles.length === initialLength) {
            return res.status(404).json({
                success: false,
                error: 'Vehicle not found'
            });
        }

        userProfile.driverDetails.vehicleCount = userProfile.driverDetails.vehicles.length;
        await userProfile.save();
        
        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        logger.error('Delete vehicle error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 
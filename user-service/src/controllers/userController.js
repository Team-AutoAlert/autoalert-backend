const userService = require('../services/userService');
const { validateUser, validateUserProfile, validateVehicle } = require('../middleware/validation');
const logger = require('../utils/logger');
const User = require('../models/User');

// Create a class for UserController
class UserController {
    async createUser(req, res) {
        try {
            const user = new User(req.body);
            await user.save();
            res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Create user error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const users = await User.find();
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            logger.error('Get all users error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.userId);
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
        } catch (error) {
            logger.error('Get user by ID error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateUser(req, res) {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                req.body,
                { new: true }
            );
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
        } catch (error) {
            logger.error('Update user error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const user = await User.findByIdAndDelete(req.params.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Delete user error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async verifyPhone(req, res) {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                { isPhoneVerified: true },
                { new: true }
            );
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
        } catch (error) {
            logger.error('Verify phone error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                { isEmailVerified: true },
                { new: true }
            );
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
        } catch (error) {
            logger.error('Verify email error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async addVehicle(req, res) {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            user.vehicles.push(req.body);
            await user.save();
            res.status(201).json({
                success: true,
                data: user.vehicles[user.vehicles.length - 1]
            });
        } catch (error) {
            logger.error('Add vehicle error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getVehicles(req, res) {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user.vehicles
            });
        } catch (error) {
            logger.error('Get vehicles error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateVehicle(req, res) {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            const vehicleIndex = user.vehicles.findIndex(
                v => v._id.toString() === req.params.vehicleId
            );
            if (vehicleIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehicle not found'
                });
            }
            user.vehicles[vehicleIndex] = {
                ...user.vehicles[vehicleIndex].toObject(),
                ...req.body
            };
            await user.save();
            res.json({
                success: true,
                data: user.vehicles[vehicleIndex]
            });
        } catch (error) {
            logger.error('Update vehicle error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteVehicle(req, res) {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            user.vehicles = user.vehicles.filter(
                v => v._id.toString() !== req.params.vehicleId
            );
            await user.save();
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
    }

    // Get user profile
    async getUserProfile(req, res, next) {
        try {
            const profile = await userService.getUserProfile(req.params.userId);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update user profile
    async updateUserProfile(req, res, next) {
        try {
            const validatedData = await validateUserProfile(req.body);
            const profile = await userService.updateUserProfile(req.params.userId, validatedData);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // List users
    async listUsers(req, res, next) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            const result = await userService.listUsers(filters, parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // Find user by phone
    async findByPhone(req, res) {
        try {
            const { phoneNumber } = req.query;
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number is required'
                });
            }
            const user = await User.findOne({ phoneNumber });
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
        } catch (error) {
            logger.error('Find by phone error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get user profile with phone
    async getUserProfileWithPhone(req, res, next) {
        try {
            const profile = await userService.getUserProfileWithPhone(req.params.userId);
            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Get user by email
    async getUserByEmail(req, res, next) {
        try {
            const user = await userService.getUserByEmail(req.params.email);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }
}

// Create a single instance
const userController = new UserController();

// Export the instance
module.exports = userController; 
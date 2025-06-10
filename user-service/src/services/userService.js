const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { UserNotFoundError, ValidationError } = require('../utils/errors');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class UserService {
  async createUser(userData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { userId: userData.userId },
          { email: userData.email }
        ]
      }).session(session);

      if (existingUser) {
        throw new ValidationError('User with this ID or email already exists');
      }

      // Create user
      const user = new User(userData);
      await user.save({ session });

      // Create user profile
      const userProfile = new UserProfile({
        userId: user.userId,
        role: user.role,
        phoneNumber: user.phoneNumber,
        language: user.language || 'en',
        ...(user.role === 'driver' ? { 
          driverDetails: {
            vehicles: [],
            vehicleCount: 0
          } 
        } : { 
          mechanicDetails: {
            specializations: [],
            workingHours: {}
          } 
        })
      });

      await userProfile.save({ session });
      await session.commitTransaction();

      return { user, profile: userProfile };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Create user error:', {
        error: error.message,
        stack: error.stack,
        userData: { ...userData, password: undefined }
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserById(userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new UserNotFoundError('User not found');
    }
    return user;
  }

  async getUserProfile(userId) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }
    return profile;
  }

  async updateUser(userId, updateData) {
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    if (updateData.phoneNumber) {
      await UserProfile.findOneAndUpdate(
        { userId },
        { $set: { phoneNumber: updateData.phoneNumber } }
      );
    }

    return user;
  }

  async updateUserProfile(userId, profileData) {
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, runValidators: true }
    );
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }
    return profile;
  }

  async listUsers(filters = {}, page = 1, limit = 10) {
    const users = await User.find(filters)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(filters);
    
    return {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async deleteUser(userId) {
    const user = await User.findOneAndDelete({ userId });
    if (!user) {
      throw new UserNotFoundError('User not found');
    }
    await UserProfile.findOneAndDelete({ userId });
    return user;
  }

  async addVehicle(userId, vehicleData) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }

    if (profile.role !== 'driver') {
      throw new ValidationError('Only drivers can add vehicles');
    }

    // Initialize driverDetails.vehicles if it doesn't exist
    if (!profile.driverDetails.vehicles) {
      profile.driverDetails.vehicles = [];
    }

    // Check if vehicle with same registration number already exists
    const vehicleExists = profile.driverDetails.vehicles.some(
      v => v.registrationNumber === vehicleData.registrationNumber
    );
    if (vehicleExists) {
      throw new ValidationError('Vehicle with this registration number already exists');
    }

    // Add the new vehicle
    profile.driverDetails.vehicles.push(vehicleData);
    profile.driverDetails.vehicleCount = profile.driverDetails.vehicles.length;
    
    await profile.save();
    return profile;
  }

  async getVehicles(userId) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }

    return profile.driverDetails?.vehicles || [];
  }

  async updateVehicle(userId, vehicleId, updateData) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }

    const vehicleIndex = profile.driverDetails.vehicles.findIndex(
      v => v.vehicleId === vehicleId
    );
    if (vehicleIndex === -1) {
      throw new ValidationError('Vehicle not found');
    }

    // Update vehicle data
    profile.driverDetails.vehicles[vehicleIndex] = {
      ...profile.driverDetails.vehicles[vehicleIndex].toObject(),
      ...updateData
    };

    await profile.save();
    return profile.driverDetails.vehicles[vehicleIndex];
  }

  async deleteVehicle(userId, vehicleId) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }

    profile.driverDetails.vehicles = profile.driverDetails.vehicles.filter(
      v => v.vehicleId !== vehicleId
    );
    profile.driverDetails.vehicleCount = profile.driverDetails.vehicles.length;

    await profile.save();
    return profile;
  }

  async findUserByPhone(phoneNumber) {
    const profile = await UserProfile.findOne({ phoneNumber });
    if (!profile) {
      throw new UserNotFoundError('User not found with this phone number');
    }
    return profile;
  }

  async getUserProfileWithPhone(userId) {
    const profile = await UserProfile.findOne({ userId })
      .select('+phoneNumber');
    if (!profile) {
      throw new UserNotFoundError('User profile not found');
    }
    return profile;
  }

  async getUserByEmail(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new UserNotFoundError('User not found');
    }
    return user;
  }
}

module.exports = new UserService(); 
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { UserNotFoundError, ValidationError } = require('../utils/errors');

class UserService {
  async createUser(userData) {
    const user = new User(userData);
    await user.save();

    const userProfile = new UserProfile({
      userId: user.userId,
      role: user.role,
      ...(user.role === 'driver' ? { driverDetails: {} } : { mechanicDetails: {} })
    });
    await userProfile.save();

    return { user, profile: userProfile };
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
}

module.exports = new UserService(); 
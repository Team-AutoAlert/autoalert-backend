const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
require('dotenv').config();

async function migratePhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    
    for (const user of users) {
      await UserProfile.findOneAndUpdate(
        { userId: user.userId },
        { $set: { phoneNumber: user.phoneNumber } },
        { new: true }
      );
      console.log(`Updated profile for user: ${user.userId}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migratePhoneNumbers();
}
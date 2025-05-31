const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['driver', 'mechanic'],
    required: true
  },
  // Driver-specific fields
  driverDetails: {
    licenseNumber: String,
    licenseExpiry: Date,
    preferredServiceTypes: [String],
    vehicleCount: {
      type: Number,
      default: 0
    }
  },
  // Mechanic-specific fields
  mechanicDetails: {
    specializations: [{
      type: String,
      enum: ['Engine', 'Transmission', 'Brakes', 'Electrical', 'General', 'Body Work']
    }],
    workshopName: String,
    serviceRadius: {
      type: Number,
      default: 50 // in kilometers
    },
    workingHours: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      wednesday: { start: String, end: String },
      thursday: { start: String, end: String },
      friday: { start: String, end: String },
      saturday: { start: String, end: String },
      sunday: { start: String, end: String }
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);

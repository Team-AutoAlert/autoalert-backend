const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  communicationMode: {
    type: String,
    enum: ['VOICE', 'VIDEO'],
    required: true
  },
  callDetails: {
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'NOT_STARTED'
    }
  },
  resolutionStatus: {
    type: String,
    enum: ['RESOLVED', 'UNRESOLVED', 'ESCALATED'],
    default: 'UNRESOLVED'
  },
  resolutionNotes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SOSAlert', sosAlertSchema); 
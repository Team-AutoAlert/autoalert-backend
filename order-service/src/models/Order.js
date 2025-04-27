const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  vehicleOwnerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  mechanicId: {
    type: String,
    ref: 'User'
  },
  orderType: {
    type: String,
    enum: ['SOS', 'ONSITE'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
    default: 'PENDING'
  },
  issueDetails: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema); 
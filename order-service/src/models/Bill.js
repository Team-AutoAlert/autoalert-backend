const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  mechanicId: {
    type: String,
    required: true,
    ref: 'User'
  },
  vehicleOwnerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DISPUTED', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentId: {
    type: String,
    ref: 'Payment'
  },
  disputeDetails: {
    reason: String,
    status: {
      type: String,
      enum: ['NONE', 'PENDING', 'RESOLVED'],
      default: 'NONE'
    },
    resolution: String
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

module.exports = mongoose.model('Bill', billSchema); 
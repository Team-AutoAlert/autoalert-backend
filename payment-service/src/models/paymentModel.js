const mongoose = require('mongoose');
const config = require('../config/config');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  merchantId: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    enum: config.currency.supported,
    default: config.currency.default,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(config.paymentStatus),
    default: config.paymentStatus.PENDING,
  },
  customer: {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: config.validation.email.regex,
    },
    phone: {
      type: String,
      trim: true,
      match: config.validation.phone.regex,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
  },
  paymentDetails: {
    transactionId: {
      type: String,
      trim: true,
    },
    method: {
      type: String,
      trim: true,
    },
    card: {
      type: {
        last4: String,
        brand: String,
        expiryMonth: String,
        expiryYear: String,
      },
      select: false, // For security, card details are not included in queries by default
    },
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  statusHistory: [{
    status: {
      type: String,
      required: true,
      enum: Object.values(config.paymentStatus),
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    description: String,
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.paymentDetails.card; // Remove sensitive data
      return ret;
    },
  },
});

// Indexes for better query performance
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ 'customer.email': 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to update status history
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      description: 'Payment status updated',
    });
  }
  next();
});

// Instance method to update payment status
paymentSchema.methods.updateStatus = async function(newStatus, description = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    description,
  });
  return this.save();
};

// Static method to find payments by customer email
paymentSchema.statics.findByCustomerEmail = function(email) {
  return this.find({ 'customer.email': email.toLowerCase() })
    .sort({ createdAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 
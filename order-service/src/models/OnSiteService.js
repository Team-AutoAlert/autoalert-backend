const mongoose = require('mongoose');

const onSiteServiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  serviceDetails: {
    type: String,
    required: true
  },
  estimatedArrivalTime: Date,
  actualArrivalTime: Date,
  serviceStartTime: Date,
  serviceEndTime: Date,
  serviceStatus: {
    type: String,
    enum: ['PENDING_ARRIVAL', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING_ARRIVAL'
  },
  serviceNotes: String,
  partsUsed: [{
    partName: String,
    quantity: Number,
    cost: Number
  }],
  laborHours: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('OnSiteService', onSiteServiceSchema); 
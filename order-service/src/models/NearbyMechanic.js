const mongoose = require('mongoose');

const nearbyMechanicSchema = new mongoose.Schema({
    driverId: {
        type: String,
        required: true
    },
    mechanicId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    driverLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    vehicleId: {
        type: String,
        required: true
    },
    breakdownDetails: {
        type: String,
        required: true
    },
    services: [{
        name: String,
        description: String,
        charge: Number
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    estimatedArrivalTime: {
        type: Date
    },
    actualArrivalTime: {
        type: Date
    },
    completionTime: {
        type: Date
    },
    billId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geospatial queries
nearbyMechanicSchema.index({ driverLocation: '2dsphere' });

// Update the updatedAt timestamp before saving
nearbyMechanicSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('NearbyMechanic', nearbyMechanicSchema); 
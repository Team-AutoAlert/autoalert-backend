const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
    driverId: {
        type: String,
        required: true,
        index: true
    },
    mechanicId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    startLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number] // [longitude, latitude]
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number] // [longitude, latitude]
    },
    estimatedArrivalTime: Date,
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    distance: Number, // in meters
    duration: Number  // in seconds
}, {
    timestamps: true
});

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);

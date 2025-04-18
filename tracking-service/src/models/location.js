const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    userType: {
        type: String,
        enum: ['driver', 'mechanic'],
        required: true
    },
    location: {
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
    status: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'available'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Create geospatial index
locationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);

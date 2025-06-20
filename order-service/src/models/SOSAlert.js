const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
    driverId: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'in_progress', 'completed', 'cancelled'],
        default: 'active'
    },
    communicationMode: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    breakdownDetails: {
        type: String,
        required: true
    },
    requiredSpecializations: [{
        type: String,
        required: true
    }],
    matchedMechanicIds: [{
        type: String
    }],
    mechanicId: {
        type: String,
        default: null
    },
    callDuration: {
        type: Number,
        default: null
    },
    charges: {
        type: Number,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            // Remove unwanted fields
            delete ret.__v;
            return ret;
        }
    }
});

sosAlertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SOSAlert', sosAlertSchema); 
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    deviceToken: {
        type: String,
        required: true,
        unique: true
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Device', deviceSchema);
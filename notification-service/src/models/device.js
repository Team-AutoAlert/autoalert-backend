const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    phoneNumber: {
        type: String,
        required: false,
        sparse: true
    },
    fcmToken: {
        type: String,
        required: false,
        sparse: true
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

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    phoneNumber: {
        type: String,
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

// Create a compound unique index on userId and phoneNumber
deviceSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });    

module.exports = mongoose.model('Device', deviceSchema);

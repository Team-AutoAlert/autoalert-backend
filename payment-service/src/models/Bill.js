const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    alertId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SOSAlert'
    },
    driverId: {
        type: String,
        required: true
    },
    mechanicId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    callDuration: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    paidAt: {
        type: Date
    }
});

module.exports = mongoose.model('Bill', billSchema); 
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SOSAlert'
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nearby'
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
    orderType: {
        type: String,
        required: true
    },
    services: [{
        name: String,
        description: String,
        charge: Number
    }],
    status: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    callDuration: {
        type: Number,
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
const Bill = require('../models/Bill');
const logger = require('../utils/logger');
const PayHere = require('../utils/payhere');

// Calculate charges based on call duration and other factors
const calculateCharges = (callDuration) => {
    const baseRate = 10; // Base rate per minute
    const minimumCharge = 20; // Minimum charge for any call
    const charge = Math.max(baseRate * callDuration, minimumCharge);
    return charge;
};

// Generate a new bill
exports.generateBill = async (req, res) => {
    try {
        const { alertId, driverId, mechanicId, callDuration } = req.body;

        // Validate required fields
        if (!alertId || !driverId || !mechanicId || !callDuration) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if bill already exists for this alert
        const existingBill = await Bill.findOne({ alertId });
        if (existingBill) {
            return res.status(400).json({
                success: false,
                message: 'Bill already exists for this alert'
            });
        }

        // Calculate charges
        const amount = calculateCharges(callDuration);

        // Create new bill
        const bill = new Bill({
            alertId,
            driverId,
            mechanicId,
            amount,
            callDuration,
            orderType: 'sos_alert',
            status: 'unpaid'
        });

        await bill.save();

        logger.info('Bill generated successfully', {
            billId: bill._id,
            alertId,
            amount,
            callDuration,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: bill,
            message: 'Bill generated successfully'
        });
    } catch (error) {
        logger.error('Error generating bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating bill',
            error: error.message
        });
    }
};

// Generate bill for nearby mechanic service
exports.generateNearbyBill = async (req, res) => {
    try {
        const {
            requestId,
            driverId,
            mechanicId,
            amount,
            services
        } = req.body;

        // Validate required fields
        if (!requestId || !driverId || !mechanicId || !amount || !services) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create new bill
        const bill = new Bill({
            requestId,
            driverId,
            mechanicId,
            amount,
            services,
            orderType: 'nearby_mechanic',
            status: 'unpaid'
        });

        await bill.save();

        logger.info('Nearby mechanic bill generated:', {
            billId: bill._id,
            requestId,
            amount,
            services: services.length
        });

        res.status(201).json({
            success: true,
            data: bill,
            message: 'Bill generated successfully'
        });
    } catch (error) {
        logger.error('Error generating nearby mechanic bill:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error generating bill',
            error: error.message
        });
    }
};

// Get all bills with optional filters
exports.getAllBills = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const bills = await Bill.find(query)
            .sort({ status: 1, createdAt: -1 }) // Sort by status (pending first) and date (newest first)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Bill.countDocuments(query);

        res.json({
            success: true,
            data: bills,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            message: 'Successfully retrieved bills'
        });
    } catch (error) {
        logger.error('Error getting bills:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving bills',
            error: error.message
        });
    }
};

// Get bills by driver ID
exports.getBillsByDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Execute query with pagination
        const bills = await Bill.find({ driverId })
            .sort({ status: 1, createdAt: -1 }) // Sort by status (pending first) and date (newest first)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Bill.countDocuments({ driverId });

        res.json({
            success: true,
            data: bills,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            message: 'Successfully retrieved driver bills'
        });
    } catch (error) {
        logger.error('Error getting driver bills:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving driver bills',
            error: error.message
        });
    }
};

// Get bills by mechanic ID
exports.getBillsByMechanic = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Execute query with pagination
        const bills = await Bill.find({ mechanicId })
            .sort({ status: 1, createdAt: -1 }) // Sort by status (pending first) and date (newest first)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Bill.countDocuments({ mechanicId });

        res.json({
            success: true,
            data: bills,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            message: 'Successfully retrieved mechanic bills'
        });
    } catch (error) {
        logger.error('Error getting mechanic bills:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving mechanic bills',
            error: error.message
        });
    }
};

// Process payment for a bill
exports.processPayment = async (req, res) => {
    try {
        const { billId } = req.body;
        const { paymentMethod } = req.body;

        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        if (bill.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Bill is already paid'
            });
        }

        const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

        // Initialize PayHere payment
        const payhereConfig = {
            merchant_id: process.env.PAYHERE_MERCHANT_ID,
            return_url: `${apiGatewayUrl}/api/payments/return`,
            cancel_url: `${apiGatewayUrl}/api/payments/cancel`,
            notify_url: `${apiGatewayUrl}/api/payments/notify`,
            first_name: 'Customer',
            last_name: 'Fernando',
            email: bill.driverId ? `${bill.driverId}@autoalert.com` : 'customer@autoalert.com',
            phone: '0771234567', // Default phone number
            address: 'No 1, Main Street',
            city: 'Colombo',
            country: 'Sri Lanka',
            order_id: `ORDER_${billId}`,
            currency: { value: 'LKR' },
            amount: { value: bill.amount.toFixed(2) }
        };

        // Create PayHere payment session
        const payhere = new PayHere(payhereConfig);
        const paymentSession = await payhere.createPaymentSession();

        // Update bill with payment method and mark as paid
        bill.paymentMethod = paymentMethod;
        bill.status = 'paid';
        bill.paymentDate = new Date();
        await bill.save();

        // Return payment session details
        return res.json({
            success: true,
            data: {
                paymentUrl: paymentSession.payment_url,
                paymentData: paymentSession.payment_data,
                billId: bill._id,
                amount: bill.amount
            },
            message: 'Payment session created successfully'
        });
    } catch (error) {
        logger.error('Payment processing failed:', {
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            success: false,
            message: 'Payment processing failed',
            error: error.message
        });
    }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            data: {
                billId: bill._id,
                status: bill.status,
                amount: bill.amount,
                paymentDetails: bill.paymentDetails,
                paidAt: bill.paidAt
            },
            message: 'Successfully retrieved payment status'
        });
    } catch (error) {
        logger.error('Error getting payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving payment status',
            error: error.message
        });
    }
};

// Get bill by order ID (requestId or alertId)
exports.getBillByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Try to find bill by alertId first
        let bill = await Bill.findOne({ alertId: orderId });
        
        // If not found, try to find by requestId
        if (!bill) {
            bill = await Bill.findOne({ requestId: orderId });
        }

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found for the given order ID'
            });
        }

        res.json({
            success: true,
            data: bill,
            message: 'Successfully retrieved bill'
        });
    } catch (error) {
        logger.error('Error getting bill by order ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving bill',
            error: error.message
        });
    }
}; 

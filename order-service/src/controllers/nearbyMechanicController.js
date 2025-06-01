const NearbyMechanic = require('../models/NearbyMechanic');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

// List nearby mechanics
exports.listNearbyMechanics = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { maxDistance = 5000 } = req.query; // maxDistance in meters

        // Get driver's location from user service
        const driverResponse = await axios.get(`${config.userServiceUrl}/api/users/${driverId}`);
        const driver = driverResponse.data;

        if (!driver || !driver.location || !driver.location.coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Driver location not found'
            });
        }

        const [longitude, latitude] = driver.location.coordinates;

        // Call tracking service to get nearby mechanics
        const response = await axios.get(`${config.trackingServiceUrl}/api/tracking/mechanics/nearby`, {
            params: {
                longitude,
                latitude,
                maxDistance
            }
        });

        const nearbyMechanics = response.data.data;

        res.json({
            success: true,
            data: nearbyMechanics,
            message: 'Successfully retrieved nearby mechanics'
        });
    } catch (error) {
        logger.error('Error listing nearby mechanics:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving nearby mechanics',
            error: error.message
        });
    }
};

// Send hire request to mechanic
exports.sendHireRequest = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const { 
            driverId, 
            vehicleId, 
            breakdownDetails, 
            requiredExpertise 
        } = req.body;

        // Get driver's location from user service
        const driverResponse = await axios.get(`${config.userServiceUrl}/api/users/${driverId}`);
        const driver = driverResponse.data;

        if (!driver || !driver.location || !driver.location.coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Driver location not found'
            });
        }

        const [longitude, latitude] = driver.location.coordinates;

        // Create new hire request
        const hireRequest = new NearbyMechanic({
            driverId,
            mechanicId,
            driverLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            status: 'pending',
            vehicleId,
            breakdownDetails,
            requiredExpertise
        });

        await hireRequest.save();

        // Notify mechanic
        await axios.post(`${config.notificationServiceUrl}/api/notifications/send`, {
            userId: mechanicId,
            message: `You have received a new hire request. Vehicle: ${vehicleId}, Issue: ${breakdownDetails}`,
        });

        res.status(201).json({
            success: true,
            data: hireRequest,
            message: 'Hire request sent successfully'
        });
    } catch (error) {
        logger.error('Error sending hire request:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending hire request',
            error: error.message
        });
    }
};

// List hire requests by mechanic
exports.listHireRequests = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const query = { mechanicId };
        if (status) query.status = status;

        const requests = await NearbyMechanic.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('driverId', 'name phone');

        const total = await NearbyMechanic.countDocuments(query);

        res.json({
            success: true,
            data: requests,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            message: 'Successfully retrieved hire requests'
        });
    } catch (error) {
        logger.error('Error listing hire requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving hire requests',
            error: error.message
        });
    }
};

// Accept hire request
exports.acceptHireRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { mechanicId } = req.body;

        const request = await NearbyMechanic.findOne({
            _id: requestId,
            mechanicId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found or already processed'
            });
        }

        // Get estimated arrival time from tracking service
        const trackingResponse = await axios.get(`${config.trackingServiceUrl}/api/tracking/mechanics/estimate-arrival`, {
            params: {
                mechanicId,
                destination: request.driverLocation.coordinates
            }
        });

        const { estimatedTime } = trackingResponse.data;

        request.status = 'accepted';
        request.estimatedArrivalTime = new Date(Date.now() + estimatedTime * 1000);
        await request.save();

        // Notify driver
        await axios.post(`${config.notificationServiceUrl}/api/notifications/send`, {
            userId: request.driverId,
            message: `A mechanic has accepted your request. Estimated arrival time: ${request.estimatedArrivalTime}`
        });

        res.json({
            success: true,
            data: request,
            message: 'Hire request accepted successfully'
        });
    } catch (error) {
        logger.error('Error accepting hire request:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting hire request',
            error: error.message
        });
    }
};

// Track mechanic
exports.trackMechanic = async (req, res) => {
    try {
        const { requestId } = req.params;
        const driverId = req.user._id; // Assuming user is authenticated

        const request = await NearbyMechanic.findOne({
            _id: requestId,
            driverId,
            status: 'accepted'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or not accepted'
            });
        }

        // Get mechanic location from tracking service
        const trackingResponse = await axios.get(`${config.trackingServiceUrl}/api/tracking/location/${request.mechanicId}`);

        res.json({
            success: true,
            data: {
                mechanicLocation: trackingResponse.data.location,
                estimatedArrivalTime: request.estimatedArrivalTime
            },
            message: 'Successfully retrieved mechanic location'
        });
    } catch (error) {
        logger.error('Error tracking mechanic:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking mechanic',
            error: error.message
        });
    }
};

// Complete job and generate bill
exports.completeJob = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { services } = req.body;
        const mechanicId = req.user._id; // Assuming user is authenticated

        const request = await NearbyMechanic.findOne({
            _id: requestId,
            mechanicId,
            status: 'accepted'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or not accepted'
            });
        }

        // Calculate total amount
        const totalAmount = services.reduce((sum, service) => sum + service.charge, 0);

        // Update request
        request.status = 'completed';
        request.services = services;
        request.totalAmount = totalAmount;
        request.completionTime = new Date();
        await request.save();

        // Generate bill
        const billResponse = await axios.post(`${config.paymentServiceUrl}/api/payments/bills`, {
            driverId: request.driverId,
            mechanicId: request.mechanicId,
            amount: totalAmount,
            services: services,
            orderId: request._id,
            orderType: 'nearby_mechanic'
        });

        request.billId = billResponse.data.data._id;
        await request.save();

        // Notify driver
        await axios.post(`${config.notificationServiceUrl}/api/notification/send`, {
            userId: request.driverId,
            title: 'Job Completed',
            message: `Your service has been completed. Total amount: $${totalAmount}`,
            data: {
                requestId: request._id,
                billId: request.billId,
                type: 'job_completed'
            }
        });

        res.json({
            success: true,
            data: {
                request,
                bill: billResponse.data.data
            },
            message: 'Job completed and bill generated successfully'
        });
    } catch (error) {
        logger.error('Error completing job:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing job',
            error: error.message
        });
    }
}; 
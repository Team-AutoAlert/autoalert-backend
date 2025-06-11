const SOSAlert = require('../models/SOSAlert');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class SOSAlertService {
    // Get all alerts with filtering and pagination
    async getAllAlerts(filter = {}, skip = 0, limit = 10) {
        try {
            return await SOSAlert.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
        } catch (error) {
            logger.error('Error getting all alerts:', error);
            throw error;
        }
    }

    // Get total count of alerts with filter
    async getAlertCount(filter = {}) {
        try {
            return await SOSAlert.countDocuments(filter);
        } catch (error) {
            logger.error('Error getting alert count:', error);
            throw error;
        }
    }

    // Get all active SOS alerts
    async getActiveAlerts() {
        return await SOSAlert.find({ status: 'active' });
    }

    // Get active alerts for a specific mechanic
    async getActiveAlertsForMechanic(mechanicId) {
        try {
            return await SOSAlert.find({
                status: 'active',
                matchedMechanicIds: mechanicId
            }).sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting active alerts for mechanic:', {
                error: error.message,
                mechanicId
            });
            throw error;
        }
    }

    // Create a new SOS alert
    async createAlert(alertData) {
        const sosAlert = new SOSAlert({
            ...alertData,
            status: 'active',
            createdAt: new Date()
        });

        await sosAlert.save();
        return sosAlert;
    }

    // Accept SOS alert by mechanic
    async acceptAlert(alertId, mechanicId) {
        const sosAlert = await SOSAlert.findById(alertId);
        
        if (!sosAlert) {
            throw new Error('SOS alert not found');
        }

        if (sosAlert.status !== 'active') {
            throw new Error('SOS alert is not active');
        }

        sosAlert.mechanicId = mechanicId;
        sosAlert.status = 'in_progress';
        sosAlert.acceptedAt = new Date();

        await sosAlert.save();
        return sosAlert;
    }

    // Complete SOS alert and handle billing
    async completeAlert(alertId, callDuration) {
        const sosAlert = await SOSAlert.findById(alertId);
        
        if (!sosAlert) {
            throw new Error('SOS alert not found');
        }

        if (sosAlert.status !== 'in_progress') {
            throw new Error('SOS alert is not in progress');
        }

        // Calculate charges (example: $10 per minute)
        const charges = callDuration * 10;

        sosAlert.status = 'completed';
        sosAlert.completedAt = new Date();
        sosAlert.callDuration = callDuration;
        sosAlert.charges = charges;

        await sosAlert.save();
        return sosAlert;
    }

    // Helper methods
    async broadcastToOnlineMechanics(sosAlert) {
        try {
            await axios.post(`${config.notificationServiceUrl}/broadcast/mechanics`, {
                type: 'SOS_ALERT',
                alertId: sosAlert._id,
                breakdownDetails: sosAlert.breakdownDetails,
                location: sosAlert.location,
                communicationMode: sosAlert.communicationMode
            });
        } catch (error) {
            console.error('Error broadcasting to mechanics:', error);
            throw error;
        }
    }

    async initializeCommunication(sosAlert) {
        try {
            await axios.post(`${config.communicationServiceUrl}/initialize-call`, {
                alertId: sosAlert._id,
                vehicleOwnerId: sosAlert.vehicleOwnerId,
                mechanicId: sosAlert.mechanicId,
                mode: sosAlert.communicationMode
            });
        } catch (error) {
            console.error('Error initializing communication:', error);
            throw error;
        }
    }

    calculateCharges(duration) {
        const baseRate = config.baseRatePerMinute;
        return duration * baseRate;
    }

    // Update SOS alert
    async updateAlert(alertId, updateData) {
        try {
            const updatedAlert = await SOSAlert.findByIdAndUpdate(
                alertId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updatedAlert) {
                throw new Error('SOS alert not found');
            }

            logger.info('Successfully updated SOS alert', {
                alertId,
                updatedFields: Object.keys(updateData)
            });

            return updatedAlert;
        } catch (error) {
            logger.error('Error updating SOS alert:', {
                error: error.message,
                alertId,
                updateData
            });
            throw error;
        }
    }

    
    // Get alert by ID
    async getAlertById(alertId) {
        try {
            const alert = await SOSAlert.findById(alertId);
            if (!alert) {
                logger.warn('SOS alert not found', { alertId });
                return null;
            }
            return alert;
        } catch (error) {
            logger.error('Error getting SOS alert by ID:', {
                error: error.message,
                alertId
            });
            throw error;
        }
    }
}

module.exports = new SOSAlertService(); 
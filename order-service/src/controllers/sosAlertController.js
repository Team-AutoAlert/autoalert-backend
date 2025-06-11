const sosAlertService = require('../services/sosAlertService');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, ServiceUnavailableError } = require('../utils/errors');

class SOSAlertController {
    constructor() {
        // Bind methods to preserve 'this' context
        this.getActiveSOSAlerts = this.getActiveSOSAlerts.bind(this);
        this.createSOSAlert = this.createSOSAlert.bind(this);
        this.acceptSOSAlert = this.acceptSOSAlert.bind(this);
        this.completeSOSAlert = this.completeSOSAlert.bind(this);
        this.notifyMatchingMechanics = this.notifyMatchingMechanics.bind(this);
        this.initializeCommunication = this.initializeCommunication.bind(this);
        this.getAllSOSAlerts = this.getAllSOSAlerts.bind(this);
        this.generateBill = this.generateBill.bind(this);
        this.getActiveSOSAlertsForMech = this.getActiveSOSAlertsForMech.bind(this);
        this.getSOSAlertStatus = this.getSOSAlertStatus.bind(this);
    }

    // Create a new SOS alert - driver
    async createSOSAlert(req, res, next) {
        try {
            const {
                driverId,
                registrationNumber,
                communicationMode,
                breakdownDetails
            } = req.body;

            // Extract specializations from breakdown details
            const requiredSpecializations = breakdownDetails
                .toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 2); // Filter out short words
            
            const sosAlert = await sosAlertService.createAlert({
                driverId,
                registrationNumber,
                communicationMode,
                breakdownDetails,
                requiredSpecializations // Add this field to the alert
            });

            let notificationStatus = {
                success: false,
                message: 'No mechanics were notified',
                availableMechanics: 0,
                notifiedMechanics: 0
            };

            // Try to notify mechanics, but don't fail if it doesn't work
            try {
                const result = await this.notifyMatchingMechanics(sosAlert);
                notificationStatus = {
                    success: result.notifiedMechanics > 0,
                    message: result.availableMechanics > 0 
                        ? `Successfully notified ${result.notifiedMechanics} available mechanics with matching expertise`
                        : 'No available mechanics found with matching expertise',
                    availableMechanics: result.availableMechanics,
                    notifiedMechanics: result.notifiedMechanics
                };
            } catch (notificationError) {
                logger.error('Failed to notify mechanics, but SOS alert was created', {
                    alertId: sosAlert._id,
                    error: notificationError.message
                });
                notificationStatus.message = 'Failed to notify mechanics due to a system error';
            }

            logger.info('Successfully created SOS alert', {
                alertId: sosAlert._id,
                driverId,
                registrationNumber,
                requiredSpecializations,
                notificationStatus
            });

            res.status(201).json({
                success: true,
                data: sosAlert,
                notificationStatus,
                message: 'SOS alert created successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    
    // Get all active SOS alerts - mechanic
    async getActiveSOSAlerts(req, res, next) {
        try {
            const activeAlerts = await sosAlertService.getActiveAlerts();
            
            // Fetch driver and vehicle details for each alert
            const alertsWithDetails = await Promise.all(activeAlerts.map(async (alert) => {
                try {
                    // Get driver profile from user service
                    const driverResponse = await axios.get(`${config.userServiceUrl}/api/users/${alert.driverId}/profile`);
                    const driverProfile = driverResponse.data.data;

                    // Find the specific vehicle from driver's vehicles
                    const vehicleDetails = driverProfile.driverDetails?.vehicles?.find(
                        vehicle => vehicle.registrationNumber === alert.registrationNumber
                    );

                    return {
                        ...alert.toObject(),
                        driver: {
                            firstName: driverProfile.firstName,
                            lastName: driverProfile.lastName,
                            phoneNumber: driverProfile.phoneNumber,
                            email: driverProfile.email
                        },
                        vehicle: vehicleDetails || null
                    };
                } catch (error) {
                    logger.error(`Error fetching details for alert ${alert._id}:`, {
                        error: error.message,
                        alertId: alert._id,
                        driverId: alert.driverId
                    });
                    return {
                        ...alert.toObject(),
                        driver: null,
                        vehicle: null
                    };
                }
            }));

            logger.info('Successfully fetched active alerts with details', {
                count: alertsWithDetails.length
            });

            res.json({
                success: true,
                data: alertsWithDetails,
                message: 'Successfully retrieved active alerts'
            });
        } catch (error) {
            next(error);
        }
    }

    // Accept SOS alert by mechanic - mechanic
    async acceptSOSAlert(req, res, next) {
        try {
            const { alertId } = req.body;
            const { mechanicId } = req.body;

            if (!mechanicId) {
                throw new ValidationError('Mechanic ID is required');
            }

            // Accept the alert
            const sosAlert = await sosAlertService.acceptAlert(alertId, mechanicId);

            // Initialize communication
            try {
                await this.initializeCommunication(sosAlert);
                logger.info('Successfully initialized communication', {
                    alertId,
                    mechanicId,
                    communicationMode: sosAlert.communicationMode
                });
            } catch (error) {
                logger.error('Failed to initialize communication', {
                    error: error.message,
                    alertId,
                    mechanicId
                });
                // Don't fail the request if communication fails
                // The mechanic can retry communication later
            }

            res.json({
                success: true,
                data: sosAlert,
                message: 'SOS alert accepted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Complete SOS alert and generate bill
    async completeSOSAlert(req, res, next) {
        try {
            const { alertId } = req.body;
            const { callDuration } = req.body;

            if (!callDuration || callDuration <= 0) {
                throw new ValidationError('Valid call duration is required');
            }

            // Find and update the SOS alert
            const sosAlert = await sosAlertService.completeAlert(alertId, callDuration);

            // Generate bill through payment service
            try {
                const billResponse = await this.generateBill(sosAlert);
                logger.info('Successfully generated bill', {
                    alertId,
                    amount: sosAlert.charges,
                    callDuration
                });
            } catch (error) {
                logger.error('Error generating bill', {
                    error: error.message,
                    alertId,
                    amount: sosAlert.charges
                });
                // Don't fail the request if billing fails
                // The bill can be generated later
            }

            res.json({
                success: true,
                data: sosAlert,
                message: 'SOS alert completed successfully and bill generated'
            });
        } catch (error) {
            next(error);
        }
    }

    async generateBill(sosAlert) {
        try {
            const response = await axios.post(`${config.paymentServiceUrl}/api/payments/bills`, {
                alertId: sosAlert._id,
                driverId: sosAlert.driverId,
                mechanicId: sosAlert.mechanicId,
                callDuration: sosAlert.callDuration
            });

            logger.info('Bill service response:', {
                alertId: sosAlert._id,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            logger.error('Error generating bill', {
                error: error.message,
                alertId: sosAlert._id
            });
            throw new ServiceUnavailableError('Failed to generate bill');
        }
    }

    // Helper methods
    async notifyMatchingMechanics(sosAlert) {
        try {
            // Get all mechanics from user service
            const response = await axios.get(`${config.userServiceUrl}/api/users`, {
                params: {
                    role: 'mechanic'
                }
            });

            // Fix: Access mechanics from response.data.data instead of response.data.users
            const mechanics = response.data.data?.filter(user => user.role === 'mechanic') || [];
            
            logger.info('Fetched mechanics from user service', {
                totalMechanics: mechanics.length,
                mechanics: mechanics
            });

            if (!mechanics || !Array.isArray(mechanics) || mechanics.length === 0) {
                logger.warn('No mechanics found or invalid response format', {
                    alertId: sosAlert._id,
                    responseData: response.data
                });
                return { availableMechanics: 0, notifiedMechanics: 0 };
            }

            // Fetch complete profiles for all mechanics
            const mechanicProfiles = await Promise.all(
                mechanics.map(async (mechanic) => {
                    try {
                        const profileResponse = await axios.get(`${config.userServiceUrl}/api/users/${mechanic.userId}`);
                        const mechanicProfile = await axios.get(`${config.userServiceUrl}/api/users/${mechanic.userId}/profile`);
                        logger.info('Fetched mechanic profile', {
                            mechanicId: mechanic.userId,
                            profile: profileResponse.data,
                            mechanicDetails: mechanicProfile.data
                        });
                        return {
                            ...mechanicProfile.data,
                            status: profileResponse.data.data.status
                        };
                    } catch (error) {
                        logger.error('Error fetching mechanic profile', {
                            mechanicId: mechanic._id,
                            error: error.message
                        });
                        return null;
                    }
                })
            );

            // Filter out any failed profile fetches
            const validMechanicProfiles = mechanicProfiles.filter(profile => profile !== null);
            logger.info('Valid mechanic profiles', {
                totalValidProfiles: validMechanicProfiles.length,
                profiles: validMechanicProfiles
            });

            // Filter mechanics based on status and expertise
            const availableMechanics = validMechanicProfiles.filter(mechanic => {
                // Check if mechanic has at least one of the required specializations
                const mechanicSpecializations = mechanic.mechanicDetails?.specializations || [];
                logger.info('Checking mechanic specializations', {
                    mechanicId: mechanic.userId,
                    mechanicSpecializations,
                    requiredSpecializations: sosAlert.requiredSpecializations
                });

                const hasMatchingSpecialization = mechanicSpecializations.some(spec => 
                    sosAlert.requiredSpecializations.includes(spec.toLowerCase())
                );

                if (!hasMatchingSpecialization) {
                    logger.debug('Mechanic does not have any matching specializations', {
                        mechanicId: mechanic.userId,
                        mechanicSpecializations,
                        requiredSpecializations: sosAlert.requiredSpecializations
                    });
                    return false;
                }

                // Check if mechanic is active
                const isActive = mechanic.status === 'active';
                
                logger.info('Mechanic status check', {
                    mechanicId: mechanic.userId,
                    status: mechanic.status,
                    isActive
                });

                if (!isActive) {
                    logger.debug('Mechanic is not active', {
                        mechanicId: mechanic.userId,
                        status: mechanic.status
                    });
                }

                return isActive;
            });

            logger.info('Available mechanics after filtering', {
                totalAvailable: availableMechanics.length,
                availableMechanics: availableMechanics.map(m => ({
                    mechanicId: m.userId,
                    specializations: m.mechanicDetails?.specializations,
                    status: m.status
                }))
            });

            // Update the SOS alert with matched mechanic IDs
            const matchedMechanicIds = availableMechanics.map(mechanic => mechanic.userId);
            await sosAlertService.updateAlert(sosAlert._id, { matchedMechanicIds });

            logger.info('Updated SOS alert with matched mechanics', {
                alertId: sosAlert._id,
                matchedMechanicCount: matchedMechanicIds.length
            });

            if (availableMechanics.length === 0) {
                logger.warn('No available mechanics found with matching expertise', {
                    alertId: sosAlert._id,
                    requiredSpecializations: sosAlert.requiredSpecializations
                });
                return { availableMechanics: 0, notifiedMechanics: 0 };
            }

            // Send notifications to available mechanics
            try {
                // await axios.post(`${config.notificationServiceUrl}/api/notifications/send/bulk`, {
                //     userIds: availableMechanics.map(m => m.userId),
                //     title: 'New SOS Alert',
                //     message: `New breakdown alert: ${sosAlert.breakdownDetails}`,
                //     data: {
                //         type: 'SOS_ALERT',
                //         alertId: sosAlert._id,
                //         breakdownDetails: sosAlert.breakdownDetails,
                //     }
                // });
                const firstMechanic = availableMechanics[0];
                    await axios.post(`${config.notificationServiceUrl}/api/notifications/send`, {
                        userId: firstMechanic.userId,
                        title: 'New SOS Alert',
                        message: `New breakdown alert: ${sosAlert.breakdownDetails}`,
                        data: {
                            type: 'SOS_ALERT',
                            alertId: sosAlert._id,
                            breakdownDetails: sosAlert.breakdownDetails,
                        }
                    });

                logger.info('Successfully notified matching mechanics', {
                    alertId: sosAlert._id,
                    mechanicCount: availableMechanics.length,
                });

                return {
                    availableMechanics: availableMechanics.length,
                    notifiedMechanics: availableMechanics.length
                };
            } catch (error) {
                logger.error('Error sending notifications to mechanics', {
                    error: error.message,
                    alertId: sosAlert._id,
                    mechanicCount: availableMechanics.length
                });
                throw new ServiceUnavailableError('Failed to send notifications to mechanics');
            }

        } catch (error) {
            logger.error('Error in notifyMatchingMechanics', {
                error: error.message,
                alertId: sosAlert._id
            });
            throw error;
        }
    }

    async initializeCommunication(sosAlert) {
        try {
            // Get user phone numbers from user service
            const [driverResponse, mechanicResponse] = await Promise.all([
                axios.get(`${config.userServiceUrl}/api/users/${sosAlert.driverId}/profile`),
                axios.get(`${config.userServiceUrl}/api/users/${sosAlert.mechanicId}/profile`)
            ]);

            const driverPhone = driverResponse.data.phoneNumber;
            const mechanicPhone = mechanicResponse.data.phoneNumber;

            if (!driverPhone || !mechanicPhone) {
                throw new ValidationError('Driver or mechanic phone number not found');
            }

            // Initialize voice call
            const response = await axios.post(`${config.communicationServiceUrl}/api/communications/voice/calls`, {
                to: driverPhone,
                from: mechanicPhone,
                userId: sosAlert.driverId,
                callType: 'traditional',
                mediaType: sosAlert.communicationMode,
                channelName: `sos-alert-${sosAlert._id}`,
                participants: {
                    driver: {
                        id: sosAlert.driverId,
                        phoneNumber: driverPhone
                    },
                    mechanic: {
                        id: sosAlert.mechanicId,
                        phoneNumber: mechanicPhone
                    }
                }
            });

            logger.info('Communication service response:', {
                alertId: sosAlert._id,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            logger.error('Error initializing communication', {
                error: error.message,
                alertId: sosAlert._id,
                driverId: sosAlert.driverId,
                mechanicId: sosAlert.mechanicId,
                statusCode: error.response?.status,
                responseData: error.response?.data
            });
            throw new ServiceUnavailableError('Failed to initialize communication');
        }
    }

    // Get all SOS alerts regardless of status
    async getAllSOSAlerts(req, res, next) {
        try {
            const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
            
            // Build filter object
            const filter = {};
            if (status) {
                filter.status = status;
            }
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    filter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    filter.createdAt.$lte = new Date(endDate);
                }
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Get total count for pagination
            const totalAlerts = await sosAlertService.getAlertCount(filter);
            
            // Get alerts with pagination
            const alerts = await sosAlertService.getAllAlerts(filter, skip, parseInt(limit));

            logger.info('Successfully fetched all alerts', {
                totalCount: totalAlerts,
                page,
                limit,
                filter
            });

            res.json({
                success: true,
                data: {
                    alerts,
                    pagination: {
                        total: totalAlerts,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(totalAlerts / limit)
                    }
                },
                message: 'Successfully retrieved all alerts'
            });
        } catch (error) {
            next(error);
        }
    }

    async getSOSAlertStatus(req, res, next) {
        try {
            const { alertId } = req.params;

            // Get the SOS alert
            const alert = await sosAlertService.getAlertById(alertId);
            
            if (!alert) {
                return res.status(404).json({
                    success: false,
                    message: 'SOS alert not found'
                });
            }

            
            res.json({
                success: true,
                data: {
                    status: alert.status,
                }
            });
        } catch (error) {
            logger.error('Error getting SOS alert status:', error);
            next(error);
        }
    }

    async getActiveSOSAlertsForMech(req, res, next) {
        try {
            const { mechanicId } = req.params;

            // Get active alerts where this mechanic is in the matchedMechanicIds array
            const activeAlerts = await sosAlertService.getActiveAlertsForMechanic(mechanicId);
            
            // Fetch driver and vehicle details for each alert
            const alertsWithDetails = await Promise.all(activeAlerts.map(async (alert) => {
                try {
                    // Get driver profile from user service
                    const driverResponse = await axios.get(`${config.userServiceUrl}/api/users/${alert.driverId}/profile`);
                    const driverProfile = driverResponse.data.data;

                    // Find the specific vehicle from driver's vehicles
                    const vehicleDetails = driverProfile.driverDetails?.vehicles?.find(
                        vehicle => vehicle.registrationNumber === alert.registrationNumber
                    );

                    return {
                        ...alert.toObject(),
                        driver: {
                            firstName: driverProfile.firstName,
                            lastName: driverProfile.lastName,
                            phoneNumber: driverProfile.phoneNumber,
                            email: driverProfile.email
                        },
                        vehicle: vehicleDetails || null
                    };
                } catch (error) {
                    logger.error(`Error fetching details for alert ${alert._id}:`, {
                        error: error.message,
                        alertId: alert._id,
                        driverId: alert.driverId
                    });
                    return {
                        ...alert.toObject(),
                        driver: null,
                        vehicle: null
                    };
                }
            }));

            logger.info('Successfully fetched active alerts for mechanic', {
                mechanicId,
                count: alertsWithDetails.length
            });

            res.json({
                success: true,
                data: alertsWithDetails,
                message: 'Successfully retrieved active alerts for mechanic'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SOSAlertController(); 
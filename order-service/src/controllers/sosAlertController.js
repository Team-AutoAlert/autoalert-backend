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
    }

    // Create a new SOS alert - driver
    async createSOSAlert(req, res, next) {
        try {
            const {
                driverId,
                vehicleId,
                communicationMode,
                breakdownDetails,
                requiredExpertise
            } = req.body;

            // Validate required expertise
            if (!requiredExpertise || !Array.isArray(requiredExpertise) || requiredExpertise.length === 0) {
                throw new ValidationError('Required expertise must be a non-empty array');
            }

            const sosAlert = await sosAlertService.createAlert({
                driverId,
                vehicleId,
                communicationMode,
                breakdownDetails,
                requiredExpertise
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
                    success: true,
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
                vehicleId,
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
                    const driverResponse = await axios.get(`${config.userServiceUrl}/users/${alert.driverId}/profile`);
                    const driverProfile = driverResponse.data.data;

                    // Find the specific vehicle from driver's vehicles
                    const vehicleDetails = driverProfile.driverDetails.vehicles.find(
                        vehicle => vehicle._id === alert.vehicleId
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
                data: alertsWithDetails
            });
        } catch (error) {
            next(error);
        }
    }

    // Accept SOS alert by mechanic - mechanic
    async acceptSOSAlert(req, res, next) {
        try {
            const { alertId } = req.params;
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
            const { alertId } = req.params;
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
                amount: sosAlert.charges,
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
                alertId: sosAlert._id,
                amount: sosAlert.charges
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

            const mechanics = response.data.users;
            if (!mechanics || !Array.isArray(mechanics)) {
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
                        const profileResponse = await axios.get(`${config.userServiceUrl}/api/users/${mechanic.userId}/profile`);
                        return profileResponse.data;
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

            const currentTime = new Date();
            const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const [currentHourStr, currentMinuteStr] = currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }).split(':');
            const currentTimeInMinutes = parseInt(currentHourStr) * 60 + parseInt(currentMinuteStr);

            logger.info('Checking mechanic availability', {
                currentDay,
                currentTime: `${currentHourStr}:${currentMinuteStr}`,
                currentTimeInMinutes
            });

            // Filter mechanics based on availability and expertise
            const availableMechanics = validMechanicProfiles.filter(mechanic => {
                // Check if mechanic has required expertise
                const hasRequiredExpertise = sosAlert.requiredExpertise.some(expertise => 
                    mechanic.mechanicDetails?.specializations?.includes(expertise)
                );

                if (!hasRequiredExpertise) return false;

                // Check if mechanic is currently working
                const workingHours = mechanic.mechanicDetails?.workingHours?.[currentDay];
                if (!workingHours) return false;

                const [startHourStr, startMinuteStr] = workingHours.start.split(':');
                const [endHourStr, endMinuteStr] = workingHours.end.split(':');
                
                const startTimeInMinutes = parseInt(startHourStr) * 60 + parseInt(startMinuteStr);
                const endTimeInMinutes = parseInt(endHourStr) * 60 + parseInt(endMinuteStr);

                return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
            });

            if (availableMechanics.length === 0) {
                logger.warn('No available mechanics found with matching expertise', {
                    alertId: sosAlert._id,
                    requiredExpertise: sosAlert.requiredExpertise
                });
                return { availableMechanics: 0, notifiedMechanics: 0 };
            }

            // Send notifications to available mechanics
            try {
                await axios.post(`${config.notificationServiceUrl}/api/notifications/send/bulk`, {
                    userIds: availableMechanics.map(m => m.userId),
                    message: `New SOS Alert: ${sosAlert.breakdownDetails}. Required expertise: ${sosAlert.requiredExpertise.join(', ')}. Communication mode: ${sosAlert.communicationMode}`
                });

                logger.info('Successfully notified matching mechanics', {
                    alertId: sosAlert._id,
                    mechanicCount: availableMechanics.length
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
            throw error; // Propagate the error to be handled by the caller
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
                to: mechanicPhone,
                from: driverPhone,
                userId: sosAlert.driverId
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

    // // Get alerts for a specific mechanic based on availability and expertise
    // async getMechanicAlerts(req, res, next) {
    //     try {
    //         const { mechanicId } = req.params;

    //         // Get mechanic details from user service
    //         let mechanicProfile;
    //         try {
    //             const userServiceUrl = `${config.userServiceUrl}/users/${mechanicId}/profile`;
    //             logger.info('Fetching mechanic profile from:', { url: userServiceUrl });
                
    //             const mechanicResponse = await axios.get(userServiceUrl);
    //             logger.info('User service response:', { 
    //                 status: mechanicResponse.status,
    //                 data: mechanicResponse.data 
    //             });
                
    //             mechanicProfile = mechanicResponse.data.data;
    //         } catch (error) {
    //             logger.error('Error fetching mechanic profile', {
    //                 error: error.message,
    //                 mechanicId,
    //                 statusCode: error.response?.status,
    //                 responseData: error.response?.data,
    //                 config: {
    //                     url: error.config?.url,
    //                     method: error.config?.method,
    //                     headers: error.config?.headers
    //                 }
    //             });
    //             throw new ServiceUnavailableError('Unable to fetch mechanic details. Please try again later.');
    //         }

    //         if (!mechanicProfile || mechanicProfile.role !== 'mechanic') {
    //             throw new NotFoundError('Mechanic not found or invalid role');
    //         }

    //         // Get all active alerts
    //         const activeAlerts = await sosAlertService.getActiveAlerts();

    //         // Get current time for availability check
    //         const currentTime = new Date();
    //         const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    //         const currentHour = currentTime.getHours();

    //         // Check if mechanic is currently working
    //         const workingHours = mechanicProfile.mechanicDetails?.workingHours?.[currentDay];
    //         const isAvailable = workingHours && (() => {
    //             const [startHour, endHour] = workingHours.split('-').map(h => parseInt(h));
    //             return currentHour >= startHour && currentHour < endHour;
    //         })();

    //         if (!isAvailable) {
    //             logger.info('Mechanic is not currently working', {
    //                 mechanicId,
    //                 currentDay,
    //                 currentHour,
    //                 workingHours: workingHours || 'Not set'
    //             });
    //             return res.json({
    //                 success: true,
    //                 data: [],
    //                 message: 'No alerts available - mechanic is not currently working'
    //             });
    //         }

    //         // Filter alerts based on mechanic's expertise
    //         const matchingAlerts = await Promise.all(activeAlerts
    //             .filter(alert => {
    //                 // Check if mechanic has any of the required expertise
    //                 return alert.requiredExpertise.some(expertise => 
    //                     mechanicProfile.mechanicDetails?.specializations?.includes(expertise)
    //                 );
    //             })
    //             .map(async (alert) => {
    //                 try {
    //                     // Get driver profile from user service
    //                     const driverResponse = await axios.get(`${config.userServiceUrl}/users/${alert.driverId}/profile`);
    //                     const driverProfile = driverResponse.data.data;

    //                     // Find the specific vehicle from driver's vehicles
    //                     const vehicleDetails = driverProfile.driverDetails?.vehicles?.find(
    //                         vehicle => vehicle._id === alert.vehicleId
    //                     );

    //                     return {
    //                         ...alert.toObject(),
    //                         driver: {
    //                             firstName: driverProfile.firstName,
    //                             lastName: driverProfile.lastName,
    //                             phoneNumber: driverProfile.phoneNumber,
    //                             email: driverProfile.email
    //                         },
    //                         vehicle: vehicleDetails || null,
    //                         matchingExpertise: alert.requiredExpertise.filter(expertise => 
    //                             mechanicProfile.mechanicDetails?.specializations?.includes(expertise)
    //                         )
    //                     };
    //                 } catch (error) {
    //                     logger.error(`Error fetching details for alert ${alert._id}:`, {
    //                         error: error.message,
    //                         alertId: alert._id,
    //                         driverId: alert.driverId
    //                     });
    //                     return {
    //                         ...alert.toObject(),
    //                         driver: null,
    //                         vehicle: null,
    //                         matchingExpertise: alert.requiredExpertise.filter(expertise => 
    //                             mechanicProfile.mechanicDetails?.specializations?.includes(expertise)
    //                         )
    //                     };
    //                 }
    //             }));

    //         logger.info('Successfully fetched alerts for mechanic', {
    //             mechanicId,
    //             alertCount: matchingAlerts.length
    //         });

    //         res.json({
    //             success: true,
    //             data: matchingAlerts,
    //             message: matchingAlerts.length > 0 ? 
    //                 'Found matching alerts for mechanic' : 
    //                 'No matching alerts found for mechanic'
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // }

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
}

module.exports = new SOSAlertController(); 
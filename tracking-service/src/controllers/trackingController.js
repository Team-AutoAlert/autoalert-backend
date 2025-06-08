const trackingService = require('../services/trackingService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');
const Location = require('../models/location');
const axios = require('axios');
const config = require('../config/config');
const { Client } = require('@googlemaps/google-maps-services-js');

// Helper function to calculate straight-line distance
function calculateStraightLineDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI/180;
    const φ2 = point2.latitude * Math.PI/180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI/180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

// Helper function to calculate distance for a mechanic
function calculateDistance(mechanic, driverLocation) {
    const distance = calculateStraightLineDistance(
        driverLocation,
        { 
            latitude: mechanic.location.coordinates[1],
            longitude: mechanic.location.coordinates[0]
        }
    );
    
    logger.info('Distance calculation for mechanic:', {
        mechanicId: mechanic.userId,
        mechanicName: `${mechanic.firstName} ${mechanic.lastName}`,
        driverLocation: driverLocation,
        mechanicLocation: {
            latitude: mechanic.location.coordinates[1],
            longitude: mechanic.location.coordinates[0]
        },
        distance: {
            meters: Math.round(distance),
            kilometers: (distance / 1000).toFixed(2)
        }
    });

    return {
        ...mechanic,
        distance: {
            meters: Math.round(distance),
            kilometers: (distance / 1000).toFixed(2)
        }
    };
}

class TrackingController {
    constructor() {
        this.mapsClient = new Client({});
    }

    async updateLocation(req, res) {
        try {
            const { userId, userType, latitude, longitude } = req.body;
            const location = await trackingService.updateLocation(
                userId,
                userType,
                latitude,
                longitude
            );
            res.json(location);
        } catch (error) {
            logger.error('Error in updateLocation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async findNearbyMechanics(req, res) {
        try {
            const { latitude, longitude, maxDistance } = req.query;
            
            logger.info('Finding nearby mechanics request:', {
                latitude,
                longitude,
                maxDistance
            });

            const mechanics = await trackingService.findNearbyMechanics(
                { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                parseFloat(maxDistance)
            );

            res.json({
                success: true,
                data: mechanics,
                message: mechanics.length > 0 
                    ? `Found ${mechanics.length} nearby mechanics`
                    : 'No nearby mechanics found'
            });
        } catch (error) {
            logger.error('Error in findNearbyMechanics:', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({
                success: false,
                message: 'Error finding nearby mechanics',
                error: error.message
            });
        }
    }

    async startTracking(req, res) {
        try {
            const { driverId, mechanicId, startLocation } = req.body;
            const session = await trackingService.startTracking(
                driverId,
                mechanicId,
                startLocation
            );
            res.json(session);
        } catch (error) {
            logger.error('Error in startTracking:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateTrackingSession(req, res) {
        try {
            const { sessionId } = req.params;
            const { currentLocation } = req.body;
            const session = await trackingService.updateTrackingSession(
                sessionId,
                currentLocation
            );
            socketService.emitLocationUpdate(sessionId, currentLocation);
            res.json(session);
        } catch (error) {
            logger.error('Error in updateTrackingSession:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async endTracking(req, res) {
        try {
            const { sessionId } = req.params;
            const session = await trackingService.endTracking(sessionId);
            socketService.emitSessionUpdate(sessionId, { status: 'completed' });
            res.json(session);
        } catch (error) {
            logger.error('Error in endTracking:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async listAllNearbyMechanics(req, res) {
        try {
            const { latitude, longitude } = req.body;
            const maxDistance = 5000; // 5km in meters

            logger.info('Finding nearby mechanics:', {
                latitude,
                longitude,
                maxDistance
            });

            // Get all mechanics from user service
            const userServiceResponse = await axios.get(`${config.userServiceUrl}/api/users`, {
                params: {
                    role: 'mechanic'
                }
            });

            logger.info('User service response:', {
                status: userServiceResponse.status,
                data: userServiceResponse.data
            });

            const mechanics = userServiceResponse.data.data || [];
            
            // Filter to ensure we only have mechanics
            const filteredMechanics = mechanics.filter(user => user.role === 'mechanic');
            
            logger.info('Fetched users:', {
                total: mechanics.length,
                mechanics: filteredMechanics.length,
                roles: mechanics.map(m => m.role)
            });

            // Get locations for all mechanics
            const mechanicsWithLocations = await Promise.all(
                filteredMechanics.map(async (mechanic) => {
                    try {
                        // Check if mechanic already has location data
                        if (mechanic.location && mechanic.location.coordinates) {
                            logger.info('Using existing location data for mechanic:', {
                                mechanicId: mechanic.userId,
                                location: mechanic.location
                            });
                            return mechanic;
                        }

                        const locationResponse = await axios.get(`${config.userServiceUrl}/api/users/${mechanic.userId}/profile`);
                        logger.info('Profile response for mechanic:', {
                            mechanicId: mechanic.userId,
                            hasLocation: !!locationResponse.data.data.location,
                            location: locationResponse.data.data.location
                        });

                        if (!locationResponse.data.data.location) {
                            logger.warn('No location data found for mechanic:', {
                                mechanicId: mechanic.userId
                            });
                            return null;
                        }

                        return {
                            ...mechanic,
                            location: locationResponse.data.data.location
                        };
                    } catch (error) {
                        logger.error('Error fetching mechanic location:', {
                            mechanicId: mechanic.userId,
                            error: error.message,
                            response: error.response?.data
                        });
                        return null;
                    }
                })
            );

            // Filter out mechanics without locations
            const validMechanics = mechanicsWithLocations.filter(m => m && m.location && m.location.coordinates);
            logger.info('Mechanics with valid locations:', {
                total: mechanicsWithLocations.length,
                valid: validMechanics.length,
                invalid: mechanicsWithLocations.length - validMechanics.length
            });

            // Calculate distances and filter mechanics within maxDistance
            const driverLocation = { latitude, longitude };
            logger.info('Starting distance calculations:', {
                driverLocation,
                totalMechanics: validMechanics.length
            });

            const nearbyMechanics = validMechanics
                .map(mechanic => calculateDistance(mechanic, driverLocation))
                .filter(m => m.distance.meters <= maxDistance)
                .sort((a, b) => a.distance.meters - b.distance.meters);

            logger.info('Distance calculation results:', {
                totalMechanics: validMechanics.length,
                nearbyMechanics: nearbyMechanics.length,
                maxDistance: maxDistance,
                mechanics: nearbyMechanics.map(m => ({
                    id: m.userId,
                    name: `${m.firstName} ${m.lastName}`,
                    distance: m.distance
                }))
            });

            res.json({
                success: true,
                data: nearbyMechanics,
                message: nearbyMechanics.length > 0 
                    ? `Found ${nearbyMechanics.length} nearby mechanics`
                    : 'No nearby mechanics found'
            });
        } catch (error) {
            logger.error('Error listing nearby mechanics:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            res.status(500).json({
                success: false,
                message: 'Error finding nearby mechanics',
                error: error.message
            });
        }
    }
}

module.exports = new TrackingController();

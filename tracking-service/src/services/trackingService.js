const { Client } = require('@googlemaps/google-maps-services-js');
const Location = require('../models/location');
const TrackingSession = require('../models/trackingSession');
const logger = require('../utils/logger');

class TrackingService {
    constructor() {
        this.mapsClient = new Client({});
    }

    async updateLocation(userId, userType, latitude, longitude) {
        try {
            const location = await Location.findOneAndUpdate(
                { userId },
                {
                    userType,
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    lastUpdated: new Date()
                },
                { upsert: true, new: true }
            );
            return location;
        } catch (error) {
            logger.error('Error updating location:', error);
            throw error;
        }
    }

    async findNearbyMechanics(driverLocation, maxDistance = 5000) {
        try {
            const mechanics = await Location.find({
                userType: 'mechanic',
                status: 'available',
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [driverLocation.longitude, driverLocation.latitude]
                        },
                        $maxDistance: maxDistance // 5km in meters
                    }
                }
            });
            return mechanics;
        } catch (error) {
            logger.error('Error finding nearby mechanics:', error);
            throw error;
        }
    }

    async startTracking(driverId, mechanicId, startLocation) {
        try {
            const session = await TrackingSession.create({
                driverId,
                mechanicId,
                startLocation: {
                    type: 'Point',
                    coordinates: [startLocation.longitude, startLocation.latitude]
                },
                currentLocation: {
                    type: 'Point',
                    coordinates: [startLocation.longitude, startLocation.latitude]
                }
            });

            // Update mechanic status to busy
            await Location.findOneAndUpdate(
                { userId: mechanicId },
                { status: 'busy' }
            );

            return session;
        } catch (error) {
            logger.error('Error starting tracking session:', error);
            throw error;
        }
    }

    async updateTrackingSession(sessionId, currentLocation) {
        try {
            const session = await TrackingSession.findById(sessionId);
            if (!session) {
                throw new Error('Tracking session not found');
            }

            // Calculate ETA using Google Maps API
            const eta = await this.calculateETA(
                currentLocation,
                session.startLocation.coordinates
            );

            session.currentLocation.coordinates = [
                currentLocation.longitude,
                currentLocation.latitude
            ];
            session.estimatedArrivalTime = new Date(Date.now() + eta.duration * 1000);
            session.distance = eta.distance;
            session.duration = eta.duration;

            await session.save();
            return session;
        } catch (error) {
            logger.error('Error updating tracking session:', error);
            throw error;
        }
    }

    async calculateETA(origin, destination) {
        try {
            const response = await this.mapsClient.directions({
                params: {
                    origin: `${origin.latitude},${origin.longitude}`,
                    destination: `${destination[1]},${destination[0]}`,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });

            const route = response.data.routes[0];
            return {
                distance: route.legs[0].distance.value,
                duration: route.legs[0].duration.value
            };
        } catch (error) {
            logger.error('Error calculating ETA:', error);
            throw error;
        }
    }

    async endTracking(sessionId) {
        try {
            const session = await TrackingSession.findByIdAndUpdate(
                sessionId,
                {
                    status: 'completed',
                    endTime: new Date()
                },
                { new: true }
            );

            // Update mechanic status back to available
            await Location.findOneAndUpdate(
                { userId: session.mechanicId },
                { status: 'available' }
            );

            return session;
        } catch (error) {
            logger.error('Error ending tracking session:', error);
            throw error;
        }
    }
}

module.exports = new TrackingService();

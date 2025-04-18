const trackingService = require('../services/trackingService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

class TrackingController {
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
            const mechanics = await trackingService.findNearbyMechanics(
                { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                parseFloat(maxDistance)
            );
            res.json(mechanics);
        } catch (error) {
            logger.error('Error in findNearbyMechanics:', error);
            res.status(500).json({ error: 'Internal server error' });
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
}

module.exports = new TrackingController();

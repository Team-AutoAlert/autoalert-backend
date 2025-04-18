const socketIo = require('socket.io');
const logger = require('../utils/logger');

class SocketService {
    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            socket.on('join-tracking-session', (sessionId) => {
                socket.join(`session-${sessionId}`);
                logger.info(`Client ${socket.id} joined session ${sessionId}`);
            });

            socket.on('location-update', (data) => {
                this.io.to(`session-${data.sessionId}`).emit('location-updated', data);
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }

    emitLocationUpdate(sessionId, location) {
        this.io.to(`session-${sessionId}`).emit('location-updated', location);
    }

    emitSessionUpdate(sessionId, update) {
        this.io.to(`session-${sessionId}`).emit('session-updated', update);
    }
}

module.exports = new SocketService();

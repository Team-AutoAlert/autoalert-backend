const admin = require('firebase-admin');
const logger = require('../utils/logger');
const path = require('path');

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(require('../../firebase-service-account.json'))
    });
    logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
}

module.exports = admin; 
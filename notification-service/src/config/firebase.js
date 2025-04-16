const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin with your service account
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
    logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
}

module.exports = admin;

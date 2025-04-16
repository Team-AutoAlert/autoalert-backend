const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

try {
    // Get the absolute path to your service account file
    const serviceAccount = require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
}

module.exports = admin;

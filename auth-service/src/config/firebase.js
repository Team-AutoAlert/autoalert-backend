const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

try {
    const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    logger.info('Firebase Admin initialized successfully');
} catch (error) {
    logger.error('Error initializing Firebase Admin:', error);
    throw error;
}

module.exports = admin;
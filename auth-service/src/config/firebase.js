const admin = require('firebase-admin');
const logger = require('../utils/logger');

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // For production, use environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    logger.info('Using Firebase service account from environment variables');
  } else {
    // For local development, use JSON file
    serviceAccount = require('../../firebase-service-account.json');
    logger.info('Using Firebase service account from local file');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  logger.info('Firebase Admin initialized successfully');
} catch (error) {
  logger.error('Firebase initialization error:', error);
  // Don't throw error, let the application start
  // Individual endpoints will handle Firebase errors
}

module.exports = admin; 
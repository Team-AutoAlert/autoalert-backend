const admin = require('firebase-admin');
const config = require('./config');
const logger = require('../utils/logger');

let firebaseConfig;

try {
  if (config.env === 'production') {
    // Use environment variables in production
    firebaseConfig = config.firebase;
  } else {
    // Use local service account file in development
    firebaseConfig = require('../../firebase-service-account.json');
  }

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    logger.info('Firebase Admin initialized successfully');
  }
} catch (error) {
  logger.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase: ' + error.message);
}

module.exports = admin; 
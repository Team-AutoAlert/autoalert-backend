const admin = require('firebase-admin');
const logger = require('../utils/logger');
const path = require('path');

try {
  // Method 1: Using service account JSON file
  const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));
  
  // OR Method 2: Using environment variables
  /*
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };
  */

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization error:', error);
  process.exit(1);
}

module.exports = admin; 